const Groq = require('groq-sdk');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const Transaction = require('../models/Transaction');
const AgentData = require('../models/AgentData');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET copilot context - fetches user's financial data for display
exports.getCopilotContext = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = student._id;

    // Fetch profile
    const profile = await StudentProfile.findOne({ student: studentId });
    
    // Get current month transactions summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          student: studentId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          excludeFromReports: false
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

    const incomeData = monthlyTransactions.find(t => t._id === 'income') || { total: 0, count: 0 };
    const expenseData = monthlyTransactions.find(t => t._id === 'expense') || { total: 0, count: 0 };

    // Get top expense categories this month
    const topExpenses = await Transaction.aggregate([
      {
        $match: {
          student: studentId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
          excludeFromReports: false
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 3
      }
    ]);

    // Get active goals
    const activeShortTermGoals = profile?.shortTermGoals?.filter(g => !g.isCompleted) || [];
    const activeLongTermGoals = profile?.longTermGoals?.filter(g => !g.isCompleted) || [];

    // Calculate totals
    const totalExpenses = profile ? profile.getTotalExpenses() : 0;
    const netBalance = (profile?.monthlyIncome || 0) - totalExpenses - (profile?.debtPaymentMonthly || 0);

    // Build context object
    const context = {
      name: student.name,
      email: student.email,
      profile: {
        monthlyIncome: profile?.monthlyIncome || 0,
        monthlyBudget: profile?.monthlyBudget || 0,
        currentSavings: profile?.currentSavings || 0,
        savingsGoal: profile?.savingsGoal || 0,
        totalDebt: profile?.totalDebt || 0,
        debtPaymentMonthly: profile?.debtPaymentMonthly || 0,
        totalExpenses: totalExpenses,
        netBalance: netBalance
      },
      thisMonth: {
        income: incomeData.total,
        expenses: expenseData.total,
        transactions: incomeData.count + expenseData.count,
        topExpenseCategories: topExpenses.map(e => ({
          category: e._id,
          amount: e.total
        }))
      },
      goals: {
        activeShortTerm: activeShortTermGoals.length,
        activeLongTerm: activeLongTermGoals.length,
        upcomingDeadlines: [...activeShortTermGoals, ...activeLongTermGoals]
          .filter(g => g.deadline)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 3)
          .map(g => ({
            title: g.title,
            deadline: g.deadline,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount
          }))
      }
    };

    res.status(200).json(context);
  } catch (error) {
    console.error('Error fetching copilot context:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST copilot chat - handles chat messages with AI
exports.sendCopilotMessage = async (req, res) => {
  try {
    const { firebaseUid, message, mode, conversationHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = student._id;

    // Fetch comprehensive user context
    const profile = await StudentProfile.findOne({ student: studentId });
    
    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = await Transaction.find({
      student: studentId,
      date: { $gte: thirtyDaysAgo },
      excludeFromReports: false
    })
    .sort({ date: -1 })
    .limit(50)
    .select('type amount category description date');

    // Get agent data if available
    const agentData = mode ? await AgentData.findOne({ student: studentId, type: mode }) : null;

    // Calculate stats
    const totalExpenses = profile ? profile.getTotalExpenses() : 0;
    const netSavingsPotential = profile ? profile.getNetSavingsPotential() : 0;
    
    // Aggregate transaction stats
    const incomeTotal = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseTotal = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Build context for AI
    const userContext = `
USER FINANCIAL PROFILE:
Name: ${student.name}
Monthly Income: ₹${profile?.monthlyIncome || 0}
Monthly Budget: ₹${profile?.monthlyBudget || 0}
Current Savings: ₹${profile?.currentSavings || 0}
Savings Goal: ₹${profile?.savingsGoal || 0}
Total Debt: ₹${profile?.totalDebt || 0}
Monthly Debt Payment: ₹${profile?.debtPaymentMonthly || 0}

MONTHLY EXPENSES BREAKDOWN:
- Rent: ₹${profile?.rentExpense || 0}
- Food: ₹${profile?.foodExpense || 0}
- Transportation: ₹${profile?.transportationExpense || 0}
- Utilities: ₹${profile?.utilitiesExpense || 0}
- Other: ₹${profile?.otherExpenses || 0}
- Total Expenses: ₹${totalExpenses}
- Net Savings Potential: ₹${netSavingsPotential}

LAST 30 DAYS ACTIVITY:
- Total Income: ₹${incomeTotal}
- Total Expenses: ₹${expenseTotal}
- Net Balance: ₹${incomeTotal - expenseTotal}
- Transactions Count: ${recentTransactions.length}

ACTIVE GOALS:
${profile?.shortTermGoals?.filter(g => !g.isCompleted).map(g => 
  `- ${g.title} (Target: ₹${g.targetAmount}, Current: ₹${g.currentAmount || 0}, Deadline: ${g.deadline ? new Date(g.deadline).toLocaleDateString('en-IN') : 'No deadline'})`
).join('\n') || 'No active short-term goals'}

${profile?.longTermGoals?.filter(g => !g.isCompleted).map(g => 
  `- ${g.title} (Target: ₹${g.targetAmount}, Current: ₹${g.currentAmount || 0}, Deadline: ${g.deadline ? new Date(g.deadline).toLocaleDateString('en-IN') : 'No deadline'})`
).join('\n') || 'No active long-term goals'}

RECENT TRANSACTIONS (Last 10):
${recentTransactions.slice(0, 10).map(t => 
  `- ${new Date(t.date).toLocaleDateString('en-IN')}: ${t.type === 'income' ? '+' : '-'}₹${t.amount} (${t.category}) ${t.description ? '- ' + t.description : ''}`
).join('\n')}

FINANCIAL PROFILE:
- Risk Tolerance: ${profile?.riskTolerance || 'Unknown'}
- Financial Literacy: ${profile?.financialLiteracy || 'Unknown'}
- Investment Type: ${profile?.investmentType || 'None'}
- Investments Amount: ₹${profile?.investmentsAmount || 0}
`;

    // Mode-specific system prompts
    const modePrompts = {
      budget: 'You are a Budget Agent specializing in expense tracking and spending reduction. Help the user identify overspending, suggest cutbacks, and optimize their budget allocation.',
      savings: 'You are a Savings Agent focused on goal-based saving strategies. Help the user create actionable savings plans, set realistic targets, and automate their savings.',
      debt: 'You are a Debt Manager expert in repayment strategies. Guide the user on debt consolidation, payoff methods (avalanche/snowball), and credit score improvement.',
      investment: 'You are an Investment Scout guiding beginners in Indian markets. Recommend suitable stocks, mutual funds, SIPs, and explain risk vs returns in simple terms.'
    };

    const systemPrompt = `You are Money Copilot, an AI financial advisor for students in India. You have access to the user's complete financial profile and transaction history.

${mode ? modePrompts[mode] : 'Provide comprehensive financial advice across budgeting, savings, debt management, and investments.'}

GUIDELINES:
- Always use INR (₹) for amounts, never dollars
- Be conversational, friendly, and encouraging
- Provide specific, actionable advice with exact numbers from their data
- Reference their actual transactions and goals when relevant
- Keep responses concise (2-4 paragraphs max)
- If you don't have enough data, ask clarifying questions
- Never make up numbers - only use data provided in the context

${userContext}

Based on this context, answer the user's question thoughtfully and provide actionable financial advice.`;

    // Build messages for Groq
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.status(200).json({ 
      response,
      context: {
        monthlyIncome: profile?.monthlyIncome || 0,
        currentSavings: profile?.currentSavings || 0,
        totalExpenses: totalExpenses,
        netBalance: incomeTotal - expenseTotal
      }
    });

  } catch (error) {
    console.error('Error in copilot chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
