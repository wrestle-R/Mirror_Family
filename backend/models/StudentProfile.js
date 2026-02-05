const mongoose = require('mongoose');
const goalSchema = require('./GoalSchema');
const debtSchema = require('./DebtSchema');

const studentProfileSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  // Personal & Contact
  dateOfBirth: {
    type: Date,
    default: null
  },
  education: {
    type: String,
    trim: true,
    default: ''
  },
  parentContact: {
    type: String,
    default: ''
  },
  // Income
  monthlyIncome: {
    type: Number,
    default: 0
  },
  incomeSource: {
    type: String,
    trim: true,
    default: ''
  },
  // Expenses & Budget
  monthlyBudget: {
    type: Number,
    default: 0
  },
  rentExpense: {
    type: Number,
    default: 0
  },
  foodExpense: {
    type: Number,
    default: 0
  },
  transportationExpense: {
    type: Number,
    default: 0
  },
  utilitiesExpense: {
    type: Number,
    default: 0
  },
  otherExpenses: {
    type: Number,
    default: 0
  },
  // Savings & Assets
  currentSavings: {
    type: Number,
    default: 0
  },
  savingsGoal: {
    type: Number,
    default: 0
  },
  investmentsAmount: {
    type: Number,
    default: 0
  },
  investmentType: {
    type: String,
    trim: true,
    default: ''
  },
  // Debts
  totalDebt: {
    type: Number,
    default: 0
  },
  debtDetails: {
    type: String,
    trim: true,
    default: ''
  },
  debtPaymentMonthly: {
    type: Number,
    default: 0
  },
  // Individual Debts tracking
  debts: [debtSchema],
  // Goals - Now as arrays with individual tracking
  shortTermGoals: [goalSchema],
  longTermGoals: [goalSchema],
  // Legacy goal text fields (kept for backward compatibility)
  shortTermGoalsText: {
    type: String,
    trim: true,
    default: ''
  },
  longTermGoalsText: {
    type: String,
    trim: true,
    default: ''
  },
  // Financial Status
  financialCondition: {
    type: String,
    trim: true,
    default: 'Stable'
  },
  financialLiteracy: {
    type: String,
    default: 'Beginner'
  },
  riskTolerance: {
    type: String,
    default: 'Low'
  },
  // Preferences
  currency: {
    type: String,
    default: 'INR'
  },
  preferredCommunication: {
    type: String,
    default: 'Email'
  }
}, {
  timestamps: true
});

// Method to get active (non-completed) short-term goals
studentProfileSchema.methods.getActiveShortTermGoals = function () {
  return this.shortTermGoals.filter(goal => !goal.isCompleted);
};

// Method to get active (non-completed) long-term goals
studentProfileSchema.methods.getActiveLongTermGoals = function () {
  return this.longTermGoals.filter(goal => !goal.isCompleted);
};

// Method to get completed goals
studentProfileSchema.methods.getCompletedGoals = function () {
  return {
    shortTerm: this.shortTermGoals.filter(goal => goal.isCompleted),
    longTerm: this.longTermGoals.filter(goal => goal.isCompleted)
  };
};

// Method to calculate total expenses
studentProfileSchema.methods.getTotalExpenses = function () {
  return this.rentExpense + this.foodExpense + this.transportationExpense +
    this.utilitiesExpense + this.otherExpenses;
};

// Method to calculate net savings potential
studentProfileSchema.methods.getNetSavingsPotential = function () {
  return this.monthlyIncome - this.getTotalExpenses() - this.debtPaymentMonthly;
};

// Virtual for profile completion percentage
studentProfileSchema.virtual('profileCompletion').get(function () {
  const fields = [
    this.education,
    this.monthlyIncome,
    this.monthlyBudget,
    this.currentSavings,
    this.shortTermGoals.length > 0,
    this.longTermGoals.length > 0,
    this.financialCondition,
    this.financialLiteracy
  ];
  const filled = fields.filter(f => f).length;
  return Math.round((filled / fields.length) * 100);
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
