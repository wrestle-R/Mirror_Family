const Groq = require('groq-sdk');
const AgentData = require('../models/AgentData');
const StudentProfile = require('../models/StudentProfile');
const Student = require('../models/Student');
const GoalGamification = require('../models/GoalGamification');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 

exports.analyzeGoal = async (req, res) => {
  try {
    const { goal, firebaseUid } = req.body;
    
    if (!goal || !firebaseUid) {
      return res.status(400).json({ message: 'Missing goal or firebaseUid' });
    }

    // 1. Identify Student
    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const studentId = student._id;

    // 2. Fetch Context (with fallback values)
    let profile = await StudentProfile.findOne({ student: studentId });
    if (!profile) {
      profile = { monthlyIncome: 0, monthlyBudget: 0, currentSavings: 0 };
    }

    // 3. Fetch Badges Context
    let gamification = await GoalGamification.findOne({ student: studentId });
    if (!gamification) {
      gamification = await GoalGamification.create({ student: studentId, earnedBadges: [], streaks: {} });
    }

    // Calculate progress percentage
    const targetAmount = Math.max(0, goal.targetAmount || 0);
    const currentAmount = Math.max(0, goal.currentAmount || 0);
    const progressPercent = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;

    // 4. Generate AI Analysis with better error handling
    let analysis = null;
    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `
          You are an expert financial advisor. Analyze this savings goal for an Indian student.
          Goal Title: ${goal.title || 'Unnamed'}
          Target: ₹${targetAmount}, Currently Saved: ₹${currentAmount}, Progress: ${progressPercent}%
          Deadline: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
          Student Monthly Income: ₹${profile.monthlyIncome || 0}
          
          Return a STRICT JSON object with this structure:
          {
            "forecastStatus": "On Track" | "At Risk" | "Ahead",
            "weeklyData": [
              { "name": "W1", "saved": ${Math.round(currentAmount / 4)}, "target": ${Math.round(targetAmount / 10)} },
              { "name": "W2", "saved": ${Math.round(currentAmount / 3)}, "target": ${Math.round(targetAmount / 10)} }
            ],
            "badges": [ { "name": "First Step", "icon": "🌱" } ]
          }
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a financial assistant. Return valid JSON only." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          max_tokens: 500
        });

        const content = completion.choices[0]?.message?.content?.trim();
        if (content) {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
          const jsonString = jsonMatch ? jsonMatch[1] : content;
          analysis = JSON.parse(jsonString);
        }
      } catch (aiError) {
        console.error('AI analysis error (will use defaults):', aiError.message);
        analysis = null;
      }
    }

    // 5. Fallback analysis if AI fails or no API key
    if (!analysis) {
      const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 30;
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      const remaining = Math.max(0, targetAmount - currentAmount);
      const weeklyTarget = Math.ceil(remaining / weeksLeft);

      analysis = {
        forecastStatus: progressPercent >= 75 ? 'Ahead' : progressPercent >= 50 ? 'On Track' : 'At Risk',
        weeklyData: Array.from({ length: 10 }, (_, i) => ({
          name: `W${i + 1}`,
          saved: Math.min(currentAmount + (weeklyTarget * (i + 1)), targetAmount),
          target: Math.ceil(targetAmount * ((i + 1) / 10))
        })),
        badges: progressPercent >= 50 ? [{ name: 'Halfway There', icon: '🎯' }] : [{ name: 'First Step', icon: '🌱' }]
      };
    }

    // 6. Update Gamification with AI badges
    if (analysis.badges && Array.isArray(analysis.badges) && analysis.badges.length > 0) {
      const newBadges = analysis.badges.filter(b => 
        !gamification.earnedBadges.some(eb => eb.name === b.name)
      );
      
      if (newBadges.length > 0) {
        gamification.earnedBadges.push(...newBadges.map(b => ({
          name: b.name, 
          icon: b.icon,
          goalId: goal.id,
          earnedAt: new Date()
        })));
        await gamification.save();
      }
    }

    analysis.storedBadges = gamification.earnedBadges || [];

    // 7. Cache Result
    const cacheKey = `goal_analysis_${goal._id || goal.id}`;
    await AgentData.findOneAndUpdate(
      { student: studentId, type: cacheKey },
      { 
        data: analysis,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json(analysis);

  } catch (error) {
    console.error('Error analyzing goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
