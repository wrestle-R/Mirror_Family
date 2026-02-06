const Groq = require('groq-sdk');
const AgentData = require('../../models/AgentData');
const StudentProfile = require('../../models/StudentProfile');
const Student = require('../../models/Student');
const { calculateProjections } = require('../../utils/projectionEngine');

let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (error) {
  console.warn("Groq SDK initialization failed:", error.message);
}

const getSystemPrompt = () => {
    return `You are "The Time Traveler", an advanced financial AI from 2036.
    
    TASK:
    Analyze the provided 10-year financial projection data (Current vs. Optimized).
    Create a compelling, futuristic narrative and a detailed optimized plan to reach the 'Optimized' outcome.
    
    INPUT:
    - User Profile (Income, Expenses, Debt)
    - Projections: { currentPath: [...], optimizedPath: [...], metrics: { wealthGap: ... } }
    
    OUTPUT:
    Return a strict JSON object (NO markdown).
    
    Required JSON Structure:
    {
      "narrative_current": "A bleak or mediocre description of their life in 2036 if they don't change. Use 'You' phrasing. Be realistic but impactful.",
      "narrative_future": "An inspiring description of their life in 2036 if they follow the optimized path. Mention specific achievements (debt-free, house deposit, travel).",
      "wealth_gap_highlight": "One punchy sentence highlighting the ₹ difference (e.g., 'That is a ₹45 Lakh difference - the cost of a luxury car!').",
      "optimized_plan_steps": [
        {
          "title": "Strategy Name",
          "action": "Specific action to take today (e.g., Increase SIP by ₹2000)",
          "impact": "Why this matters for 2036"
        },
         {
          "title": "Debt Destruction",
          "action": "Switch to Avalanche method...",
          "impact": "Debt free by 2028"
        }
      ],
      "future_tips": ["Tip 1", "Tip 2"]
    }
    
    Keep the tone 'Cyberpunk' or 'Futuristic' but professional finance advice.
    All amounts in INR.
    `;
};

// GET existing projection or null
exports.getProjection = async (req, res) => {
    try {
        const { firebaseUid } = req.params;
        const student = await Student.findOne({ firebaseUid });
        
        if (!student) return res.status(404).json({ message: 'Student not found' });
        
        const agentData = await AgentData.findOne({ student: student._id, type: 'time-machine' });
        
        if (!agentData) {
             return res.status(200).json({ data: null, message: 'No time machine data found.' });
        }
        
        res.status(200).json(agentData);
    } catch (error) {
        console.error('Error fetching projection:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST generate new projection
exports.generateProjection = async (req, res) => {
    try {
        const { firebaseUid } = req.body;
        const student = await Student.findOne({ firebaseUid });
        
        if (!student) return res.status(404).json({ message: 'Student not found' });
        
        const profile = await StudentProfile.findOne({ student: student._id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        // 1. Run Math Engine
        const projections = calculateProjections(profile);

        // 2. Prepare AI Context
        const contextData = {
            profile: {
                income: profile.monthlyIncome,
                savings: profile.currentSavings,
                debt: profile.totalDebt
            },
            metrics: projections.metrics
        };

        // 3. Call LLM for Narrative
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: JSON.stringify(contextData) }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });
        
        const aiContent = JSON.parse(completion.choices[0]?.message?.content || '{}');

        // 4. Combine Math + AI
        const fullResult = {
            projections: projections, // The arrays for charts
            analysis: aiContent       // The text/plan
        };

        // 5. Save
        const savedData = await AgentData.findOneAndUpdate(
            { student: student._id, type: 'time-machine' },
            { 
                data: fullResult,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );

        res.status(200).json(savedData);

    } catch (error) {
        console.error('Error in Time Machine:', error);
        res.status(500).json({ message: 'Simulation Failed', error: error.message });
    }
};
