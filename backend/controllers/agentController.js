const Groq = require('groq-sdk');
const AgentData = require('../models/AgentData');
const StudentProfile = require('../models/StudentProfile');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (type) => {
  const basePrompt = `You are an expert financial advisor for students. You are the '${type}' agent.
  Analyze the provided user data (income, expenses, goals, transactions).
  Return a strict JSON object with NO markdown formatting, NO explanation text outside the JSON.
  The JSON structure must be compatible with Recharts (i.e., arrays of objects for charts) and contain a 'tips' array.
  
  Required JSON Structure:
  {
    "summary": "Short 1-2 sentence summary of the situation.",
    "chartData": [ { "name": "Label", "value": 100 }, ... ], // For Recharts
    "tips": [ "Tip 1", "Tip 2", "Tip 3" ], // Actionable advice
    "details": "Detailed analysis paragraph."
  }
  `;

  if (type === 'budget') {
    return basePrompt + `
    Focus on spending reduction and optimization.
    Compare user spending to soft benchmarks (e.g., 50/30/20 rule, city-aware if data implies), but remain flexible.
    Identify ONLY the top 2-3 high-impact categories to optimize.
    Estimate realistic monthly savings unlocked per category.
    Explain recommendations in terms of OPPORTUNITY COST (e.g., "Saving this amount could fast-track your emergency fund by 2 months").
    Keep tone neutral, non-judgmental, and objective.

    ADDITIONAL JSON FIELDS REQUIRED:
    "recommendations": [
      {
        "category": "Category Name",
        "currentSpending": 5000,
        "suggestedSpending": 3000,
        "potentialSavings": 2000,
        "benchmark": "Currently 15% of income (Target: 10%)",
        "opportunityCost": "This ₹2,000 could pay for your monthly utilities.",
        "action": "Limit dining out to weekends only."
      }
    ]

    chartData should be expense breakdown by category with values in INR.
    
    CHARTDATA EXAMPLE:
    [{"name": "Food", "value": 2500}, {"name": "Transport", "value": 1200}, {"name": "Entertainment", "value": 800}]
    
    All amounts in INR (Indian Rupees), no dollar signs.
    `;
  }
  if (type === 'savings') {
    return `You are a Strategic Wealth Architect financial advisor for students.
Analyze user financial data and create a comprehensive savings strategy.
Return ONLY valid JSON with NO markdown, NO extra text.

USER DATA FIELDS:
- income: monthly income
- expenses: {rent, food, transport, utilities, other}
- savings: current savings
- shortTermGoals: [{title, targetAmount, currentAmount, deadline, isCompleted}, ...]
- longTermGoals: [{title, targetAmount, currentAmount, deadline, isCompleted}, ...]

CALCULATE:
1. monthly_surplus = income - (expenses.rent + expenses.food + expenses.transport + expenses.utilities + expenses.other)
2. total_expenses = sum all expense values
3. emergency_target = total_expenses * 4
4. short_goals_sum = sum targetAmount from shortTermGoals where isCompleted is false
5. long_goals_sum = sum targetAmount from longTermGoals where isCompleted is false
6. total_goal_target = emergency_target + short_goals_sum + long_goals_sum
7. current_in_goals = sum currentAmount from all goals
8. current_total_savings = savings + current_in_goals
9. base_monthly_contribution = monthly_surplus

RETURN THIS JSON (with calculated numbers):
{
  "summary": "Strategy description",
  "monthly_surplus": 8000,
  "simulation_parameters": {
    "current_total_savings": 18000,
    "total_goal_target": 100000,
    "base_monthly_contribution": 8000
  },
  "comprehensive_plan": [
    { "step": "1", "title": "Emergency Fund", "description": "Build 4-month emergency fund first" },
    { "step": "2", "title": "Short-Term Goals", "description": "Allocate to short-term goals" },
    { "step": "3", "title": "Long-Term Wealth", "description": "Invest for long-term goals" },
    { "step": "4", "title": "Review", "description": "Review quarterly" }
  ],
  "mermaid_diagram": "graph TD\\n  A[\\"Income\\"] --> B[\\"Expenses\\"]\\n  A --> C[\\"Surplus\\"]\\n  C --> D[\\"Emergency\\"]\\n  C --> E[\\"Short Goals\\"]\\n  C --> F[\\"Long Goals\\"]",
  "tips": ["Automate savings", "Use SIPs", "Review quarterly", "Increase with raises"]
}

Mermaid rules: graph TD, IDs A-F, escape quotes [\\"Text\\"], use -->, use \\n, no rupee symbols.
All amounts INR. Return ONLY JSON.`;
  }
  if (type === 'debt') {
    return basePrompt + `
    If debts exist:
    - Analyze and recommend best repayment strategy (Avalanche for high interest, Snowball for motivation)
    - Create a month-by-month repayment calendar showing remaining balance decline
    - chartData should be: [{"name": "Month 1", "value": remainingDebt}, {"name": "Month 2", "value": remainingDebt-payment}, ...] showing 12-month timeline
    - Calculate exact payoff date and total interest saved
    - Provide specific monthly payment allocation for each debt
    
    CHARTDATA EXAMPLE (if debt exists):
    [{"name": "Month 1", "value": 50000}, {"name": "Month 2", "value": 45000}, {"name": "Month 3", "value": 40000}, {"name": "Month 4", "value": 35000}, {"name": "Month 5", "value": 30000}, {"name": "Month 6", "value": 25000}]
    
    If no debt:
    - Provide actionable credit score building tips for Indian context (Credit cards, small EMIs, payment history)
    - Explain CIBIL score importance
    - chartData should show ideal credit utilization over 6 months
    
    CHARTDATA EXAMPLE (if no debt):
    [{"name": "Month 1", "value": 30}, {"name": "Month 2", "value": 28}, {"name": "Month 3", "value": 25}, {"name": "Month 4", "value": 22}, {"name": "Month 5", "value": 20}, {"name": "Month 6", "value": 18}]
    
    All amounts in INR (Indian Rupees), no dollar signs.
    `;
  }
  if (type === 'investment') {
    return `You are an Investment Education Agent designed for first-time and non-expert users.
    
    Your job is to explain investment options in a simple, calm, and practical way.
    Assume the user has little to no financial knowledge.
    Avoid jargon unless absolutely necessary.
    If jargon is used, explain it immediately in plain language.
    
    For every investment option you explain in your advice/details, generally follow this thinking structure, and output the final advice in the "details" or "tips" fields of the JSON.
    
    Since the output MUST be a strict JSON object, please format your advice within the "details" field or "recommendations" array to follow this structure for each option:
    
    1. What it is: Explain in 1–2 simple sentences.
    2. Who this is for: Describe suitability based on income/age.
    3. Risk level: Low/Medium/High (with real-world explanation).
    4. Time horizon: Ideal duration.
    5. Why for you: Personalize based on their data.
    6. Example: Small monthly amount (₹500–₹2000).
    7. Caution: One realistic downside.
    
    Rules:
    - No legal/tax advice.
    - No guaranteed returns unless government-backed.
    - No complex/speculative instruments.
    - Neutral, reassuring tone.
    
    REQUIRED JSON OUTPUT FORMAT:
    {
      "summary": "Short 1-2 sentence summary for a beginner.",
      "chartData": [
        {"name": "Year 1", "Savings": 12000, "FD": 12800, "Index Fund": 13500},
        {"name": "Year 5", "Savings": 60000, "FD": 75000, "Index Fund": 90000}
      ],
      "tips": [
        "Invest 10-20% of your income in low-risk options like PPF or FDs.",
        "Start a ₹2,000/month SIP in a Nifty 50 Index Fund for long-term growth.",
        "Diversify with blue-chip stocks like Reliance or TCS for higher returns."
      ],
      "details": "A friendly paragraph summarizing the strategy...",
      "recommendations": [
        {
          "name": "Nifty 50 Index Fund",
          "whatItIs": "A basket of India's top 50 biggest companies.",
          "whoIsItFor": "Beginners who want to grow wealth over 5+ years.",
          "riskLevel": "Medium (Market fluctuates, but grows long-term)",
          "timeHorizon": "5+ Years",
          "whyRecommended": "<b>Based on your age</b>, you can afford some risk for higher growth.",
          "example": "If you invest ₹1000/month, it could grow significantly over 10 years.",
          "caution": "The market goes down sometimes. Don't panic sell."
        },
         {
          "name": "Public Provident Fund (PPF)",
          "whatItIs": "A government-backed savings scheme.",
          "whoIsItFor": "Risk-averse people wanting tax benefits.",
          "riskLevel": "Low (Government Guarantee)",
          "timeHorizon": "15 Years (Lock-in)",
          "whyRecommended": "Good for the safe portion of your portfolio.",
          "example": "Invest any amount to get stable returns.",
          "caution": "Money is locked for 15 years."
        }
      ]
    }
    
    All amounts in INR.
    Use this strict JSON structure. The 'recommendations' array is crucial for the frontend to display the structured cards.
    `;
  }
  return basePrompt;
};

// GET agent data (by type)
exports.getAgentData = async (req, res) => {
  try {
    const { type, firebaseUid } = req.params;

    if (!['budget', 'savings', 'debt', 'investment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid agent type' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const studentId = student._id;

    let agentData = await AgentData.findOne({ student: studentId, type });

    if (!agentData) {
      return res.status(200).json({ data: null, message: 'No analysis found. Please generate.' });
    }

    res.status(200).json(agentData);
  } catch (error) {
    console.error('Error fetching agent data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST generate agent data (by type)
exports.generateAgentData = async (req, res) => {
  try {
    const { type, firebaseUid } = req.body;

    if (!['budget', 'savings', 'debt', 'investment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid agent type' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const studentId = student._id;

    // 1. Gather Context
    const profile = await StudentProfile.findOne({ student: studentId });
    const transactions = await Transaction.find({ student: studentId }).sort({ date: -1 }).limit(50);

    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found. Please complete profile first.' });
    }

    // Prepare context for LLM
    const contextData = {
      income: profile.monthlyIncome,
      budget: profile.monthlyBudget,
      expenses: {
        rent: profile.rentExpense,
        food: profile.foodExpense,
        transport: profile.transportationExpense,
        utilities: profile.utilitiesExpense,
        other: profile.otherExpenses
      },
      savings: profile.currentSavings,
      shortTermGoals: profile.shortTermGoals || [],
      longTermGoals: profile.longTermGoals || [],
      debts: profile.totalDebt,
      transactions: transactions.map(t => ({
        date: t.date,
        amount: t.amount,
        category: t.category,
        type: t.type
      }))
    };

    // 2. Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt(type) },
        { role: "user", content: JSON.stringify(contextData) }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    let parsedData;

    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse LLM response", content);
      return res.status(500).json({ message: "AI response parsing failed", raw: content });
    }

    console.log('🤖 LLM Raw Response:', content);
    console.log('📊 Context Data Sent:', JSON.stringify(contextData, null, 2));

    // 3. Save to DB
    const agentData = await AgentData.findOneAndUpdate(
      { student: studentId, type },
      {
        data: parsedData,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );

    console.log('✅ Saved Agent Data:', JSON.stringify(parsedData, null, 2));

    res.status(200).json(agentData);

  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};