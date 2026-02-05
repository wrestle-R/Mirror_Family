const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const Transaction = require('../models/Transaction');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Get current student profile
exports.getProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID is required" });
    }

    // Find student first
    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find profile
    let profile = await StudentProfile.findOne({ student: student._id });

    // If no profile exists, create a default one
    if (!profile) {
      profile = new StudentProfile({ student: student._id });
      await profile.save();
    }

    res.status(200).json({ success: true, data: { student, profile } });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// Update student profile
exports.updateProfile = async (req, res) => {
  try {
    const { firebaseUid, name, contactNumber, dateOfBirth, education, parentContact, monthlyIncome, incomeSource, monthlyBudget, rentExpense, foodExpense, transportationExpense, utilitiesExpense, otherExpenses, currentSavings, savingsGoal, investmentsAmount, investmentType, totalDebt, debtDetails, debtPaymentMonthly, shortTermGoals, longTermGoals, shortTermGoalsText, longTermGoalsText, financialCondition, financialLiteracy, riskTolerance, preferredCommunication } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID is required" });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update Student basic info if provided
    if (name) student.name = name;
    if (contactNumber) student.contactNumber = contactNumber;
    await student.save();

    // Update or Create Profile
    let profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      profile = new StudentProfile({ student: student._id });
    }

    // Update all fields if provided
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (education !== undefined) profile.education = education;
    if (parentContact !== undefined) profile.parentContact = parentContact;
    if (monthlyIncome !== undefined) profile.monthlyIncome = monthlyIncome;
    if (incomeSource !== undefined) profile.incomeSource = incomeSource;
    if (monthlyBudget !== undefined) profile.monthlyBudget = monthlyBudget;
    if (rentExpense !== undefined) profile.rentExpense = rentExpense;
    if (foodExpense !== undefined) profile.foodExpense = foodExpense;
    if (transportationExpense !== undefined) profile.transportationExpense = transportationExpense;
    if (utilitiesExpense !== undefined) profile.utilitiesExpense = utilitiesExpense;
    if (otherExpenses !== undefined) profile.otherExpenses = otherExpenses;
    if (currentSavings !== undefined) profile.currentSavings = currentSavings;
    if (savingsGoal !== undefined) profile.savingsGoal = savingsGoal;
    if (investmentsAmount !== undefined) profile.investmentsAmount = investmentsAmount;
    if (investmentType !== undefined) profile.investmentType = investmentType;
    if (totalDebt !== undefined) profile.totalDebt = totalDebt;
    if (debtDetails !== undefined) profile.debtDetails = debtDetails;
    if (debtPaymentMonthly !== undefined) profile.debtPaymentMonthly = debtPaymentMonthly;
    // Handle goals - can be arrays or text
    if (shortTermGoals !== undefined) profile.shortTermGoals = shortTermGoals;
    if (longTermGoals !== undefined) profile.longTermGoals = longTermGoals;
    if (shortTermGoalsText !== undefined) profile.shortTermGoalsText = shortTermGoalsText;
    if (longTermGoalsText !== undefined) profile.longTermGoalsText = longTermGoalsText;
    if (financialCondition !== undefined) profile.financialCondition = financialCondition;
    if (financialLiteracy !== undefined) profile.financialLiteracy = financialLiteracy;
    if (riskTolerance !== undefined) profile.riskTolerance = riskTolerance;
    if (preferredCommunication !== undefined) profile.preferredCommunication = preferredCommunication;

    await profile.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: { student, profile } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// Add a goal (short-term or long-term)
exports.addGoal = async (req, res) => {
  try {
    const { firebaseUid, goalType, goal } = req.body;

    if (!firebaseUid || !goalType || !goal) {
      return res.status(400).json({ success: false, message: 'Firebase UID, goal type, and goal data are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      profile = new StudentProfile({ student: student._id });
    }

    const newGoal = {
      id: goal.id || `goal_${Date.now()}`,
      title: goal.title,
      description: goal.description || '',
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      priority: goal.priority || 'medium',
      category: goal.category || 'savings',
      isCompleted: false,
      completedAt: null,
      createdAt: new Date()
    };

    if (goalType === 'shortTerm') {
      profile.shortTermGoals.push(newGoal);
    } else if (goalType === 'longTerm') {
      profile.longTermGoals.push(newGoal);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid goal type. Use "shortTerm" or "longTerm"' });
    }

    await profile.save();

    res.status(201).json({ success: true, message: 'Goal added successfully', data: { profile } });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ success: false, message: 'Server error adding goal' });
  }
};

// Update a goal
exports.updateGoal = async (req, res) => {
  try {
    const { firebaseUid, goalType, goalId, updates } = req.body;

    if (!firebaseUid || !goalType || !goalId) {
      return res.status(400).json({ success: false, message: 'Firebase UID, goal type, and goal ID are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let goalArray = goalType === 'shortTerm' ? profile.shortTermGoals : profile.longTermGoals;
    const goalIndex = goalArray.findIndex(g => g.id === goalId);

    if (goalIndex === -1) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Update goal fields
    if (updates.title !== undefined) goalArray[goalIndex].title = updates.title;
    if (updates.description !== undefined) goalArray[goalIndex].description = updates.description;
    if (updates.targetAmount !== undefined) goalArray[goalIndex].targetAmount = Number(updates.targetAmount);
    if (updates.currentAmount !== undefined) goalArray[goalIndex].currentAmount = Number(updates.currentAmount);
    if (updates.deadline !== undefined) goalArray[goalIndex].deadline = updates.deadline ? new Date(updates.deadline) : null;
    if (updates.priority !== undefined) goalArray[goalIndex].priority = updates.priority;
    if (updates.category !== undefined) goalArray[goalIndex].category = updates.category;

    await profile.save();

    res.status(200).json({ success: true, message: 'Goal updated successfully', data: { profile } });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, message: 'Server error updating goal' });
  }
};

// Toggle goal completion (mark as complete/incomplete)
exports.toggleGoalCompletion = async (req, res) => {
  try {
    const { firebaseUid, goalType, goalId } = req.body;

    if (!firebaseUid || !goalType || !goalId) {
      return res.status(400).json({ success: false, message: 'Firebase UID, goal type, and goal ID are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let goalArray = goalType === 'shortTerm' ? profile.shortTermGoals : profile.longTermGoals;
    const goalIndex = goalArray.findIndex(g => g.id === goalId);

    if (goalIndex === -1) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Toggle completion
    goalArray[goalIndex].isCompleted = !goalArray[goalIndex].isCompleted;
    goalArray[goalIndex].completedAt = goalArray[goalIndex].isCompleted ? new Date() : null;

    await profile.save();

    res.status(200).json({
      success: true,
      message: goalArray[goalIndex].isCompleted ? 'Goal marked as complete' : 'Goal marked as incomplete',
      data: { profile }
    });
  } catch (error) {
    console.error('Error toggling goal completion:', error);
    res.status(500).json({ success: false, message: 'Server error toggling goal completion' });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
  try {
    const { firebaseUid, goalType, goalId } = req.body;

    if (!firebaseUid || !goalType || !goalId) {
      return res.status(400).json({ success: false, message: 'Firebase UID, goal type, and goal ID are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (goalType === 'shortTerm') {
      profile.shortTermGoals = profile.shortTermGoals.filter(g => g.id !== goalId);
    } else if (goalType === 'longTerm') {
      profile.longTermGoals = profile.longTermGoals.filter(g => g.id !== goalId);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid goal type' });
    }

    await profile.save();

    res.status(200).json({ success: true, message: 'Goal deleted successfully', data: { profile } });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Server error deleting goal' });
  }
};

// Get all goals (active and completed)
exports.getGoals = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { includeCompleted = 'true' } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let shortTermGoals = profile.shortTermGoals;
    let longTermGoals = profile.longTermGoals;

    if (includeCompleted === 'false') {
      shortTermGoals = shortTermGoals.filter(g => !g.isCompleted);
      longTermGoals = longTermGoals.filter(g => !g.isCompleted);
    }

    res.status(200).json({
      success: true,
      data: {
        shortTermGoals,
        longTermGoals,
        completedCount: {
          shortTerm: profile.shortTermGoals.filter(g => g.isCompleted).length,
          longTerm: profile.longTermGoals.filter(g => g.isCompleted).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ success: false, message: 'Server error fetching goals' });
  }
};

// --- DEBT ENDPOINTS ---

// Add a debt
exports.addDebt = async (req, res) => {
  try {
    const { firebaseUid, debt } = req.body;

    if (!firebaseUid || !debt) {
      return res.status(400).json({ success: false, message: 'Firebase UID and debt data are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      profile = new StudentProfile({ student: student._id });
    }

    const newDebt = {
      id: debt.id || `debt_${Date.now()}`,
      name: debt.name,
      balance: Number(debt.balance) || 0,
      interestRate: Number(debt.interestRate) || 0.12,
      minPayment: Number(debt.minPayment) || 0,
      category: debt.category || 'other',
      createdAt: new Date()
    };

    profile.debts.push(newDebt);

    // Auto-update legacy totalDebt field
    profile.totalDebt = profile.debts.reduce((sum, d) => sum + d.balance, 0);

    await profile.save();

    res.status(201).json({ success: true, message: 'Debt added successfully', data: { profile } });
  } catch (error) {
    console.error('Error adding debt:', error);
    res.status(500).json({ success: false, message: 'Server error adding debt' });
  }
};

// Update a debt
exports.updateDebt = async (req, res) => {
  try {
    const { firebaseUid, debtId, updates } = req.body;

    if (!firebaseUid || !debtId) {
      return res.status(400).json({ success: false, message: 'Firebase UID and debt ID are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const debtIndex = profile.debts.findIndex(d => d.id === debtId);
    if (debtIndex === -1) {
      return res.status(404).json({ success: false, message: 'Debt not found' });
    }

    // Update fields
    if (updates.name !== undefined) profile.debts[debtIndex].name = updates.name;
    if (updates.balance !== undefined) profile.debts[debtIndex].balance = Number(updates.balance);
    if (updates.interestRate !== undefined) profile.debts[debtIndex].interestRate = Number(updates.interestRate);
    if (updates.minPayment !== undefined) profile.debts[debtIndex].minPayment = Number(updates.minPayment);
    if (updates.category !== undefined) profile.debts[debtIndex].category = updates.category;

    // Auto-update legacy totalDebt field
    profile.totalDebt = profile.debts.reduce((sum, d) => sum + d.balance, 0);

    await profile.save();

    res.status(200).json({ success: true, message: 'Debt updated successfully', data: { profile } });
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ success: false, message: 'Server error updating debt' });
  }
};

// Delete a debt
exports.deleteDebt = async (req, res) => {
  try {
    const { firebaseUid, debtId } = req.body;

    if (!firebaseUid || !debtId) {
      return res.status(400).json({ success: false, message: 'Firebase UID and debt ID are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    profile.debts = profile.debts.filter(d => d.id !== debtId);

    // Auto-update legacy totalDebt field
    profile.totalDebt = profile.debts.reduce((sum, d) => sum + d.balance, 0);

    await profile.save();

    res.status(200).json({ success: true, message: 'Debt deleted successfully', data: { profile } });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ success: false, message: 'Server error deleting debt' });
  }
};

// Get all debts
exports.getDebts = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        debts: profile.debts,
        totalDebt: profile.totalDebt,
        debtPaymentMonthly: profile.debtPaymentMonthly
      }
    });
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching debts' });
  }
};

// Record monthly income as a transaction
exports.recordMonthlyIncome = async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (!profile.monthlyIncome || profile.monthlyIncome <= 0) {
      return res.status(400).json({ success: false, message: 'No monthly income set in profile' });
    }

    // Map income source to category first to ensure consistency in check and creation
    const categoryMap = {
      'allowance': 'allowance',
      'part-time job': 'salary',
      'part time job': 'salary',
      'freelance': 'freelance',
      'internship': 'salary',
      'investment returns': 'investment_return',
      'family support': 'allowance',
      'scholarship': 'scholarship',
      'other': 'other_income'
    };

    const category = categoryMap[profile.incomeSource?.toLowerCase()] || 'allowance';

    // Check if income was already recorded this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const existingTransaction = await Transaction.findOne({
      student: student._id,
      type: 'income',
      // We check for transactions that look like monthly income, regardless of category change to prevent gaming
      // But we can include category check if we want to allow different types of monthly income.
      // Given user request "cant add it twice", we should be strict.
      date: { $gte: startOfMonth, $lte: endOfMonth },
      description: { $regex: /^Monthly income/i }
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Monthly income already recorded for this month',
        transaction: existingTransaction
      });
    }

    // Create transaction
    const transaction = new Transaction({
      student: student._id,
      type: 'income',
      amount: profile.monthlyIncome,
      category: category,
      description: `Monthly income from ${profile.incomeSource || 'Allowance'}`,
      date: new Date(),
      paymentMethod: 'net_banking'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Monthly income recorded successfully!',
      data: { transaction }
    });
  } catch (error) {
    console.error('Error recording monthly income:', error);
    res.status(500).json({ success: false, message: 'Server error recording monthly income' });
  }
};

// Voice onboarding - process voice answers and extract profile data using Groq
exports.voiceOnboarding = async (req, res) => {
  try {
    const { firebaseUid, answers } = req.body;

    if (!firebaseUid || !answers) {
      return res.status(400).json({ success: false, message: 'Firebase UID and answers are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Build the prompt for Groq to extract structured data
    const systemPrompt = `You are a helpful assistant that extracts financial profile data from conversational voice answers.
Extract the following fields from the user's answers and return ONLY a valid JSON object with these exact keys:

{
  "name": "string - full name",
  "age": "number - age in years (calculate birth year from this)",
  "education": "string - education details",
  "contactNumber": "string - phone number if mentioned",
  "monthlyIncome": "number - total monthly income in INR",
  "incomeSource": "string - primary source of income (Allowance, Part-Time Job, Freelance, Internship, Family Support, Scholarship, Other)",
  "monthlyBudget": "number - estimated total monthly spending/budget in INR",
  "rentExpense": "number - monthly rent in INR (0 if not mentioned)",
  "foodExpense": "number - monthly food expenses in INR",
  "transportationExpense": "number - monthly transport costs in INR",
  "utilitiesExpense": "number - monthly utilities in INR",
  "otherExpenses": "number - other monthly expenses in INR",
  "currentSavings": "number - total current savings in INR",
  "savingsGoal": "number - savings target in INR",
  "investmentsAmount": "number - total invested amount in INR (0 if none)",
  "investmentType": "string - type of investments (None, Mutual Funds, Stocks, Fixed Deposits, PPF, SIP, Other)",
  "totalDebt": "number - total debt amount in INR (0 if none)",
  "debtDetails": "string - debt description if any",
  "financialLiteracy": "string - Beginner, Intermediate, or Advanced based on their knowledge",
  "riskTolerance": "string - Low, Medium, or High based on their goals",
  "shortTermGoals": [{"title": "string", "targetAmount": number, "description": "string"}],
  "longTermGoals": [{"title": "string", "targetAmount": number, "description": "string"}]
}

IMPORTANT:
- All monetary values should be numbers in INR (remove "rupees", "lakhs" - convert 1 lakh = 100000)
- If a value is not mentioned, use reasonable defaults (0 for expenses not mentioned)
- Parse "lakhs" correctly: 1.5 lakhs = 150000, 2 lakhs = 200000
- Parse "k" or "thousand": 25k = 25000, 50 thousand = 50000
- Return ONLY the JSON object, no explanations or markdown
- For goals, create structured objects from the descriptions`;

    const userPrompt = `Here are the user's voice answers to financial profile questions:

1. Introduction (name, age, education, contact):
${answers.intro || 'Not provided'}

2. Income details:
${answers.income || 'Not provided'}

3. Expenses breakdown:
${answers.expenses || 'Not provided'}

4. Savings and investments:
${answers.savings || 'Not provided'}

5. Financial goals:
${answers.goals || 'Not provided'}

Extract all the profile data and return as JSON.`;

    console.log('Voice onboarding: Processing answers for user:', firebaseUid);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    let extractedData;
    try {
      const content = completion.choices[0]?.message?.content;
      extractedData = JSON.parse(content);
      console.log('Voice onboarding: Extracted data:', extractedData);
    } catch (parseError) {
      console.error('Voice onboarding: JSON parse error:', parseError);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
    }

    // Update student name if provided
    if (extractedData.name) {
      student.name = extractedData.name;
    }
    if (extractedData.contactNumber) {
      student.contactNumber = extractedData.contactNumber;
    }
    await student.save();

    // Update or create profile
    let profile = await StudentProfile.findOne({ student: student._id });
    if (!profile) {
      profile = new StudentProfile({ student: student._id });
    }

    // Calculate date of birth from age
    if (extractedData.age) {
      const birthYear = new Date().getFullYear() - extractedData.age;
      profile.dateOfBirth = new Date(birthYear, 0, 1); // Jan 1 of birth year
    }

    // Update profile fields
    if (extractedData.education) profile.education = extractedData.education;
    if (extractedData.monthlyIncome !== undefined) profile.monthlyIncome = Number(extractedData.monthlyIncome) || 0;
    if (extractedData.incomeSource) profile.incomeSource = extractedData.incomeSource;
    if (extractedData.monthlyBudget !== undefined) profile.monthlyBudget = Number(extractedData.monthlyBudget) || 0;
    if (extractedData.rentExpense !== undefined) profile.rentExpense = Number(extractedData.rentExpense) || 0;
    if (extractedData.foodExpense !== undefined) profile.foodExpense = Number(extractedData.foodExpense) || 0;
    if (extractedData.transportationExpense !== undefined) profile.transportationExpense = Number(extractedData.transportationExpense) || 0;
    if (extractedData.utilitiesExpense !== undefined) profile.utilitiesExpense = Number(extractedData.utilitiesExpense) || 0;
    if (extractedData.otherExpenses !== undefined) profile.otherExpenses = Number(extractedData.otherExpenses) || 0;
    if (extractedData.currentSavings !== undefined) profile.currentSavings = Number(extractedData.currentSavings) || 0;
    if (extractedData.savingsGoal !== undefined) profile.savingsGoal = Number(extractedData.savingsGoal) || 0;
    if (extractedData.investmentsAmount !== undefined) profile.investmentsAmount = Number(extractedData.investmentsAmount) || 0;
    if (extractedData.investmentType) profile.investmentType = extractedData.investmentType;
    if (extractedData.totalDebt !== undefined) profile.totalDebt = Number(extractedData.totalDebt) || 0;
    if (extractedData.debtDetails) profile.debtDetails = extractedData.debtDetails;
    if (extractedData.financialLiteracy) profile.financialLiteracy = extractedData.financialLiteracy;
    if (extractedData.riskTolerance) profile.riskTolerance = extractedData.riskTolerance;

    // Process short-term goals
    if (extractedData.shortTermGoals && Array.isArray(extractedData.shortTermGoals)) {
      const newShortTermGoals = extractedData.shortTermGoals.map((goal, index) => ({
        id: `goal_short_${Date.now()}_${index}`,
        title: goal.title || 'Untitled Goal',
        description: goal.description || '',
        targetAmount: Number(goal.targetAmount) || 0,
        currentAmount: 0,
        deadline: null,
        priority: 'medium',
        category: 'savings',
        isCompleted: false,
        completedAt: null,
        createdAt: new Date()
      }));
      profile.shortTermGoals = [...profile.shortTermGoals, ...newShortTermGoals];
    }

    // Process long-term goals
    if (extractedData.longTermGoals && Array.isArray(extractedData.longTermGoals)) {
      const newLongTermGoals = extractedData.longTermGoals.map((goal, index) => ({
        id: `goal_long_${Date.now()}_${index}`,
        title: goal.title || 'Untitled Goal',
        description: goal.description || '',
        targetAmount: Number(goal.targetAmount) || 0,
        currentAmount: 0,
        deadline: null,
        priority: 'medium',
        category: 'savings',
        isCompleted: false,
        completedAt: null,
        createdAt: new Date()
      }));
      profile.longTermGoals = [...profile.longTermGoals, ...newLongTermGoals];
    }

    await profile.save();

    console.log('Voice onboarding: Profile saved successfully');

    res.status(200).json({
      success: true,
      message: 'Profile created from voice input successfully',
      data: { student, profile }
    });
  } catch (error) {
    console.error('Error in voice onboarding:', error);
    res.status(500).json({ success: false, message: 'Server error processing voice onboarding' });
  }
};
