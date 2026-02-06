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
    return basePrompt + `
    Act as a "Strategic Wealth Architect".
    
    CONTEXT: You will receive 'shortTermGoals' and 'longTermGoals' arrays from user data.
    
    TASKS:
    1. Calculate Monthly Surplus = Income - (Total Expenses).
    2. Aggregate ALL goal targets:
       - Sum up targetAmount from ALL shortTermGoals (filter out completed ones)
       - Sum up targetAmount from ALL longTermGoals (filter out completed ones)
       - Add Emergency Fund target (6 months of expenses if freelancer detected, else 3 months)
       - Total = Emergency + Short Term Sum + Long Term Sum
    3. Calculate current total savings across all goals (sum of currentAmount fields).
    4. Create a step-by-step execution plan (comprehensive_plan) with 3-5 strategic steps.
    5. Generate a DETAILED Mermaid flowchart (mermaid_diagram):
       - STRICT SYNTAX: Use "graph TD"
       - IDs must be alphanumeric only (A, B, C, D1, D2, etc.)
       - ALL labels must be in quotes
       - NO special characters like ₹ in labels
       - Show: Income -> Expenses -> Surplus -> [Emergency, ShortGoal1, ShortGoal2, LongGoal1, etc.]
       - Use decision nodes for allocation logic
    
    REQUIRED JSON STRUCTURE:
    {
      "summary": "High-level strategy summary in 1-2 sentences.",
      "monthly_surplus": 5000,
      "simulation_parameters": {
        "current_total_savings": 50000,
        "total_goal_target": 500000,
        "base_monthly_contribution": 5000
      },
      "comprehensive_plan": [
        { "step": "1", "title": "Emergency Shield", "description": "Build 6-month safety net in liquid funds first." },
        { "step": "2", "title": "Short-Term Wins", "description": "Allocate 40% of surplus to short-term goals." },
        { "step": "3", "title": "Long-Term Wealth", "description": "Invest remaining 30% in equity/debt mix for long-term." }
      ],
      "mermaid_diagram": "graph TD\\n  A[\\\"Monthly Income\\\"] --> B[\\\"Fixed Expenses\\\"]\\n  A --> C[\\\"Surplus\\\"]\\n  C --> D{\\\"Allocation\\\"}\\n  D --> E[\\\"Emergency Fund\\\"]\\n  D --> F[\\\"Short Term Goals\\\"]\\n  D --> G[\\\"Long Term Wealth\\\"]",
      "tips": ["Automate savings on payday", "Review goals quarterly", "Increase contributions with raises"]
    }

    All amounts in INR.
    `;
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
    return basePrompt + `
    Based on their savings and income:
    - Recommend 3-4 SPECIFIC Indian investment options they can START TODAY:
      * Low-risk: PPF (Public Provident Fund), Fixed Deposits, Liquid Funds
      * Medium-risk: Nifty 50 Index Funds, Balanced Mutual Funds, SIPs in blue-chip funds
      * Stocks: Suggest 2-3 beginner-friendly large-cap Indian stocks (e.g., Reliance, TCS, HDFC Bank) with current approx prices
    - Calculate how much they can invest monthly (suggest 10-20% of income)
    - Show potential wealth accumulation over 5 years with compound interest
    - chartData should compare returns: [{"name": "Year 1", "Savings": X, "Index Fund": Y, "PPF": Z}, ...] for 5 years
    - Provide specific action steps (e.g., "Open Zerodha/Groww account, start ₹2000/month SIP in Nifty Index")
    
    CHARTDATA EXAMPLE:
    [{"name": "Year 1", "savings": 12000, "indexFund": 13200, "ppf": 12500}, {"name": "Year 2", "savings": 24000, "indexFund": 27500, "ppf": 26000}, {"name": "Year 3", "savings": 36000, "indexFund": 43000, "ppf": 40500}, {"name": "Year 4", "savings": 48000, "indexFund": 60000, "ppf": 56000}, {"name": "Year 5", "savings": 60000, "indexFund": 79000, "ppf": 72500}]
    
    All amounts in INR (Indian Rupees), no dollar signs.
    Risk assessment based on age and current savings.
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

    // 3. Save to DB
    const agentData = await AgentData.findOneAndUpdate(
      { student: studentId, type },
      {
        data: parsedData,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );

    res.status(200).json(agentData);

  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};