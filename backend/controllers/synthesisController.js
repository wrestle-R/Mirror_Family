const Groq = require('groq-sdk');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const Transaction = require('../models/Transaction');
const AgentData = require('../models/AgentData');
const StockRecommendation = require('../models/StockRecommendation');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * GET /api/agents/synthesis/:firebaseUid
 * Accumulates all agent data, profile, transactions, and stock data
 * then uses Groq to produce a structured video briefing payload.
 */
exports.getSynthesis = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const studentId = student._id;

    // Gather all data in parallel
    const [profile, budgetAgent, savingsAgent, debtAgent, investmentAgent, stockRec, monthlyTx] = await Promise.all([
      StudentProfile.findOne({ student: studentId }),
      AgentData.findOne({ student: studentId, type: 'budget' }),
      AgentData.findOne({ student: studentId, type: 'savings' }),
      AgentData.findOne({ student: studentId, type: 'debt' }),
      AgentData.findOne({ student: studentId, type: 'investment' }),
      StockRecommendation.findOne({ student: studentId }).sort({ lastUpdated: -1 }),
      // Current month transactions
      (() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return Transaction.aggregate([
          {
            $match: {
              student: studentId,
              date: { $gte: startOfMonth, $lte: endOfMonth },
              excludeFromReports: { $ne: true }
            }
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
      })()
    ]);

    // Get top expense categories this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const topExpenses = await Transaction.aggregate([
      {
        $match: {
          student: studentId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
          excludeFromReports: { $ne: true }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Compute transaction stats
    const incomeData = monthlyTx.find(t => t._id === 'income') || { total: 0, count: 0 };
    const expenseData = monthlyTx.find(t => t._id === 'expense') || { total: 0, count: 0 };

    // Build comprehensive context for LLM
    const totalExpenses = profile ? (profile.rentExpense + profile.foodExpense + profile.transportationExpense + profile.utilitiesExpense + profile.otherExpenses) : 0;
    const monthlyIncome = profile?.monthlyIncome || 0;
    const currentSavings = profile?.currentSavings || 0;
    const savingsGoal = profile?.savingsGoal || 0;
    const totalDebt = profile?.totalDebt || 0;
    const debtPayment = profile?.debtPaymentMonthly || 0;
    const debts = profile?.debts || [];
    const shortTermGoals = profile?.shortTermGoals?.filter(g => !g.isCompleted) || [];
    const longTermGoals = profile?.longTermGoals?.filter(g => !g.isCompleted) || [];

    const contextForAI = {
      studentName: student.name,
      currency: profile?.currency || 'INR',
      monthlyIncome,
      monthlyBudget: profile?.monthlyBudget || 0,
      totalExpensesFixed: totalExpenses,
      currentSavings,
      savingsGoal,
      totalDebt,
      debtPaymentMonthly: debtPayment,
      debts: debts.map(d => ({ name: d.name, balance: d.balance, interestRate: d.interestRate, minPayment: d.minPayment, category: d.category })),
      riskTolerance: profile?.riskTolerance || 'Low',
      investmentType: profile?.investmentType || '',
      investmentsAmount: profile?.investmentsAmount || 0,
      thisMonth: {
        income: incomeData.total,
        expenses: expenseData.total,
        transactionCount: incomeData.count + expenseData.count,
        topExpenseCategories: topExpenses.map(e => ({ category: e._id, amount: e.total }))
      },
      shortTermGoals: shortTermGoals.map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount })),
      longTermGoals: longTermGoals.map(g => ({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount })),
      budgetAgentData: budgetAgent?.data || null,
      savingsAgentData: savingsAgent?.data || null,
      debtAgentData: debtAgent?.data || null,
      investmentAgentData: investmentAgent?.data || null,
      stockRecommendations: stockRec ? {
        riskAppetite: stockRec.preferences?.riskAppetite,
        topStocks: stockRec.recommendations?.slice(0, 3).map(r => ({ name: r.name, action: r.recommendedAction, allocation: r.allocation })),
        portfolioSummary: stockRec.portfolioAnalysis?.summary
      } : null
    };

    // Call Groq to synthesize all data into a structured video briefing
    const systemPrompt = `You are a financial video briefing generator for an Indian student fintech app called Money Council.
You must synthesize all the user's financial data and AI agent outputs into a structured JSON for a 30-second video briefing.

Return ONLY valid JSON. No markdown. No explanation.

The JSON must have this EXACT structure:
{
  "intro": {
    "monthName": "February 2026",
    "totalIncome": 50000,
    "totalExpenses": 32000,
    "netSavings": 18000,
    "headline": "A strong month with solid surplus"
  },
  "budget": {
    "budgetCategories": [
      { "name": "Food", "spent": 8000, "limit": 10000, "percentUsed": 80 },
      { "name": "Transport", "spent": 3000, "limit": 5000, "percentUsed": 60 },
      { "name": "Entertainment", "spent": 2500, "limit": 3000, "percentUsed": 83 }
    ],
    "budgetScore": 72,
    "topOptimization": "Reduce dining out expenses by cooking at home 3 more times per week"
  },
  "savings": {
    "monthlySavings": 18000,
    "savingsGoal": 100000,
    "currentSavings": 45000,
    "savingsRate": 36,
    "topSavingsTip": "At this rate, you'll reach your goal in 4 months"
  },
  "debt": {
    "totalDebt": 25000,
    "monthlyPayment": 5000,
    "debts": [
      { "name": "Credit Card", "balance": 15000 },
      { "name": "Personal Loan", "balance": 10000 }
    ],
    "strategy": "Focus extra payments on credit card (higher interest at 18%)"
  },
  "investment": {
    "riskLevel": "Moderate",
    "allocations": [
      { "name": "Index Funds", "percentage": 40 },
      { "name": "Fixed Deposit", "percentage": 30 },
      { "name": "Stocks", "percentage": 20 },
      { "name": "Gold", "percentage": 10 }
    ],
    "topPick": "Start a SIP of Rs.5000/month in Nifty 50 Index Fund"
  },
  "actionPlan": {
    "actions": [
      "Reduce food spending by Rs.2000 this month",
      "Set up auto-transfer of Rs.10000 to savings on salary day",
      "Pay Rs.2000 extra on credit card this month",
      "Open a Groww account and start Rs.5000 SIP"
    ]
  }
}

CRITICAL RULES:
- All amounts MUST be in INR (Indian Rupees). Use actual numbers, no symbols.
- Use REAL data from the context provided. Do NOT invent data.
- If an agent has not been run yet (null data), use the profile/transaction data to compute reasonable values.
- budgetCategories must have max 3 items from actual spending categories.
- debts array must only include debts that actually exist. If no debts, set totalDebt to 0 and debts to empty array.
- allocations must have max 4 items.
- actions must have exactly 4 items, specific and actionable.
- savingsRate is a percentage integer (0-100).
- budgetScore is an integer (0-100).
- percentUsed is an integer (0-100).
- headline should be 1 short sentence summarizing the month.
- All tips/strategies should be specific to the user's actual situation.
- If user has zero income or no data, still provide meaningful defaults based on what you see.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(contextForAI) }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    let synthesisData;

    try {
      synthesisData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse synthesis LLM response:', content);
      return res.status(500).json({ success: false, message: 'AI response parsing failed', raw: content });
    }

    res.status(200).json({
      success: true,
      data: synthesisData,
      meta: {
        studentName: student.name,
        generatedAt: new Date().toISOString(),
        agentsAvailable: {
          budget: !!budgetAgent,
          savings: !!savingsAgent,
          debt: !!debtAgent,
          investment: !!investmentAgent,
          stocks: !!stockRec
        }
      }
    });

  } catch (error) {
    console.error('Error generating synthesis:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
