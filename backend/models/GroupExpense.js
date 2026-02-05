const mongoose = require('mongoose');
const Transaction = require('./Transaction');

const splitSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  settled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const groupExpenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  category: {
    type: String,
    required: true,
    enum: [
      'food', 'transportation', 'entertainment', 'shopping', 'utilities', 
      'rent', 'groceries', 'dining_out', 'travel', 'other'
    ],
    default: 'other'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  splits: [splitSchema],
  notes: {
    type: String,
    maxlength: 500,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
  settledAt: {
    type: Date,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
groupExpenseSchema.index({ group: 1, date: -1 });
groupExpenseSchema.index({ paidBy: 1 });

// Validate that splits sum to total amount
groupExpenseSchema.pre('save', function(next) {
  if (this.splits && this.splits.length > 0) {
    const totalSplit = this.splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(totalSplit - this.amount);
    
    // Allow for small rounding errors (1 paisa)
    if (difference > 0.01) {
      return next(new Error(`Splits total (${totalSplit}) must equal expense amount (${this.amount})`));
    }
  }
  next();
});

// Static method to calculate group balances
groupExpenseSchema.statics.calculateGroupBalances = async function(groupId) {
  const [expenses, settlements] = await Promise.all([
    this.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splits.member', 'name email'),
    Transaction.find({ group: groupId, type: 'transfer' })
      .populate('student', 'name email')
      .populate('receiver', 'name email')
  ]);
  
  // Map to track balances: positive means they are owed, negative means they owe
  const balances = new Map();

  const getOrCreateBalance = (user) => {
    if (!user) return null;
    const id = user._id.toString();
    if (!balances.has(id)) {
      balances.set(id, {
        userId: id,
        name: user.name,
        email: user.email,
        balance: 0
      });
    }
    return balances.get(id);
  };
  
  // 1. Process All Expenses (ignoring settled flags for total mathematical balance)
  expenses.forEach(expense => {
    const payerBalance = getOrCreateBalance(expense.paidBy);
    if (payerBalance) payerBalance.balance += expense.amount; // User paid for the expense
    
    expense.splits.forEach(split => {
      // We process ALL splits regardless of the 'settled' flag to get the total mathematical debt
      const memberBalance = getOrCreateBalance(split.member);
      if (memberBalance) memberBalance.balance -= split.amount; // User owes for their share
    });
  });

  // 2. Process Settlements (Payments)
  // payer (student) sends money -> balance increases (they paid their debt)
  // receiver sends money -> balance decreases (they were paid)
  settlements.forEach(s => {
    if (s.student) {
      const payerBalance = getOrCreateBalance(s.student);
      if (payerBalance) payerBalance.balance += s.amount;
    }
    if (s.receiver) {
      const receiverBalance = getOrCreateBalance(s.receiver);
      if (receiverBalance) receiverBalance.balance -= s.amount;
    }
  });

  // Filter out zero balances and round
  return Array.from(balances.values())
    .map(b => ({
      ...b,
      balance: Math.round(b.balance * 100) / 100
    }))
    .filter(b => Math.abs(b.balance) > 0.01);
};

// Static method to get simplified settlements (who owes whom)
groupExpenseSchema.statics.getSimplifiedSettlements = async function(groupId) {
  const balances = await this.calculateGroupBalances(groupId);
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  
  const settlements = [];
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
    
    settlements.push({
      from: {
        userId: debtor.userId,
        name: debtor.name,
        email: debtor.email
      },
      to: {
        userId: creditor.userId,
        name: creditor.name,
        email: creditor.email
      },
      amount: Math.round(amount * 100) / 100
    });
    
    creditor.balance -= amount;
    debtor.balance += amount;
    
    if (Math.abs(creditor.balance) < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }
  
  return settlements;
};

groupExpenseSchema.methods.settle = async function() {
  this.isSettled = true;
  this.splits.forEach(split => {
    split.settled = true;
  });
  await this.save();
};

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);

module.exports = GroupExpense;
