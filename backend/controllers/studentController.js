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
    const { firebaseUid, name, contactNumber, dateOfBirth, education, parentContact, monthlyIncome, incomeSource, monthlyBudget, rentExpense, foodExpense, transportationExpense, utilitiesExpense, otherExpenses, currentSavings, savingsGoal, investmentsAmount, investmentType, totalDebt, debtDetails, debtPaymentMonthly, shortTermGoals, longTermGoals, financialCondition, financialLiteracy, riskTolerance, preferredCommunication } = req.body;

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
    if (shortTermGoals !== undefined) profile.shortTermGoals = shortTermGoals;
    if (longTermGoals !== undefined) profile.longTermGoals = longTermGoals;
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
