const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { firebaseUid, type, amount, category, description, date, paymentMethod, merchant, tags, isRecurring, recurringFrequency, notes } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const transaction = new Transaction({
      student: student._id,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      merchant: merchant || '',
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      notes: notes || ''
    });

    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Transaction created successfully',
      data: transaction 
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, message: 'Error creating transaction', error: error.message });
  }
};

// Get all transactions for a student with filtering and pagination
exports.getTransactions = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      startDate, 
      endDate, 
      sortBy = 'date', 
      sortOrder = 'desc',
      search 
    } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Build query
    const query = { student: student._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
  }
};

// Get a single transaction
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, message: 'Error fetching transaction', error: error.message });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.student;
    delete updates._id;

    if (updates.amount) updates.amount = Number(updates.amount);
    if (updates.date) updates.date = new Date(updates.date);

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Transaction updated successfully',
      data: transaction 
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Error updating transaction', error: error.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Transaction deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Error deleting transaction', error: error.message });
  }
};

// Get transaction statistics/summary
exports.getTransactionStats = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { period = 'month' } = req.query; // month, year, all

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Aggregate stats
    const [typeStats, categoryStats, recentTransactions, dailyTrend] = await Promise.all([
      // Income vs Expense totals
      Transaction.aggregate([
        {
          $match: {
            student: student._id,
            date: { $gte: startDate },
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
      ]),
      // Category breakdown for expenses
      Transaction.aggregate([
        {
          $match: {
            student: student._id,
            type: 'expense',
            date: { $gte: startDate },
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
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]),
      // Recent transactions
      Transaction.find({ student: student._id })
        .sort({ date: -1 })
        .limit(5),
      // Daily spending trend (last 30 days)
      Transaction.aggregate([
        {
          $match: {
            student: student._id,
            type: 'expense',
            date: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            excludeFromReports: false
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Process stats
    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      totalInvestment: 0,
      transactionCount: 0
    };

    typeStats.forEach(item => {
      if (item._id === 'income') {
        stats.totalIncome = item.total;
        stats.transactionCount += item.count;
      } else if (item._id === 'expense') {
        stats.totalExpense = item.total;
        stats.transactionCount += item.count;
      } else if (item._id === 'investment') {
        stats.totalInvestment = item.total;
        stats.transactionCount += item.count;
      }
    });

    stats.netSavings = stats.totalIncome - stats.totalExpense;
    stats.savingsRate = stats.totalIncome > 0 
      ? Math.round((stats.netSavings / stats.totalIncome) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: stats,
        categoryBreakdown: categoryStats,
        recentTransactions,
        dailyTrend,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching transaction stats', error: error.message });
  }
};

// Get monthly comparison data
exports.getMonthlyComparison = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { months = 6 } = req.query;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          student: student._id,
          date: { $gte: startDate },
          excludeFromReports: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Process into a more usable format
    const monthlyComparison = {};
    monthlyData.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!monthlyComparison[key]) {
        monthlyComparison[key] = { month: key, income: 0, expense: 0, investment: 0 };
      }
      monthlyComparison[key][item._id.type] = item.total;
    });

    res.status(200).json({
      success: true,
      data: Object.values(monthlyComparison)
    });
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ success: false, message: 'Error fetching monthly comparison', error: error.message });
  }
};
