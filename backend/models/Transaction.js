const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  // Optional reference to a Group (for group-related transactions like settlements)
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
    index: true
  },
  // Recipient of the transaction (for transfers/settlements)
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null,
    index: true
  },
  // Transaction Type
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer', 'investment'],
    required: true
  },
  // Amount (positive for income, expense stored as positive but represents outflow)
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Category for better organization
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'salary', 'allowance', 'freelance', 'scholarship', 'gift', 'refund', 'investment_return', 'other_income',
      // Expense categories
      'food', 'transportation', 'entertainment', 'shopping', 'utilities', 'rent', 'education', 
      'healthcare', 'subscriptions', 'groceries', 'dining_out', 'clothing', 'electronics',
      'travel', 'fitness', 'personal_care', 'gifts_donations', 'insurance', 'other_expense',
      // Investment categories
      'stocks', 'mutual_funds', 'crypto', 'fixed_deposit', 'gold', 'other_investment',
      // Transfer categories
      'savings_transfer', 'account_transfer', 'other_transfer'
    ]
  },
  // Description/Note
  description: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },
  // Transaction Date (when the transaction occurred)
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'debit_card', 'credit_card', 'net_banking', 'wallet', 'other'],
    default: 'cash'
  },
  // Merchant/Source
  merchant: {
    type: String,
    trim: true,
    maxLength: 100,
    default: ''
  },
  // Tags for custom filtering (e.g., ['college', 'monthly', 'essential'])
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  // Is this a recurring transaction?
  isRecurring: {
    type: Boolean,
    default: false
  },
  // Recurring frequency (if applicable)
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', null],
    default: null
  },
  // Attachment/Receipt URL (for future use)
  attachmentUrl: {
    type: String,
    default: null
  },
  // Linked Goal (if transaction is towards a goal)
  linkedGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    default: null
  },
  // Notes for additional context
  notes: {
    type: String,
    trim: true,
    maxLength: 1000,
    default: ''
  },
  // Currency
  currency: {
    type: String,
    default: 'INR'
  },
  // Is this transaction excluded from reports?
  excludeFromReports: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ student: 1, date: -1 });
transactionSchema.index({ student: 1, type: 1 });
transactionSchema.index({ student: 1, category: 1 });
transactionSchema.index({ date: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.type === 'income' ? '+' : '-';
  return `${sign}₹${this.amount.toLocaleString('en-IN')}`;
});

// Method to check if transaction is expense
transactionSchema.methods.isExpense = function() {
  return this.type === 'expense';
};

// Method to check if transaction is income
transactionSchema.methods.isIncome = function() {
  return this.type === 'income';
};

// Static method to get monthly summary
transactionSchema.statics.getMonthlySummary = async function(studentId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        date: { $gte: startDate, $lte: endDate },
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
};

// Static method to get category breakdown
transactionSchema.statics.getCategoryBreakdown = async function(studentId, type, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        type: type,
        date: { $gte: startDate, $lte: endDate },
        excludeFromReports: false
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
