const mongoose = require('mongoose');

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
    default: '' // e.g., "B.Tech CSE, Year 2"
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
    default: '' // e.g., Part-time job, Allowance, Freelance
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
    default: '' // e.g., "Stocks, Mutual Funds, Crypto"
  },
  // Debts
  totalDebt: {
    type: Number,
    default: 0
  },
  debtDetails: {
    type: String,
    trim: true,
    default: '' // e.g., "₹50k Education Loan, ₹10k Credit Card"
  },
  debtPaymentMonthly: {
    type: Number,
    default: 0
  },
  // Goals
  shortTermGoals: {
    type: String,
    trim: true,
    default: ''
  },
  longTermGoals: {
    type: String,
    trim: true,
    default: ''
  },
  // Financial Status
  financialCondition: {
    type: String,
    trim: true,
    default: 'Stable' // Stable, Good, Needs Improvement, Critical
  },
  financialLiteracy: {
    type: String,
    default: 'Beginner' // Beginner, Intermediate, Advanced
  },
  riskTolerance: {
    type: String,
    default: 'Low' // Low, Medium, High
  },
  // Preferences
  currency: {
    type: String,
    default: 'INR'
  },
  preferredCommunication: {
    type: String,
    default: 'Email' // Email, SMS, Push Notifications
  }
}, {
  timestamps: true
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
