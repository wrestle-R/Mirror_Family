const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');

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
