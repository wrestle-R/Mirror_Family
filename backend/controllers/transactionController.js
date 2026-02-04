const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

const ALLOWED_TRANSACTION_TYPES = ['income', 'expense', 'transfer', 'investment'];
const ALLOWED_PAYMENT_METHODS = ['cash', 'upi', 'debit_card', 'credit_card', 'net_banking', 'wallet', 'other'];
const ALLOWED_CATEGORIES = [
  // Income
  'salary', 'allowance', 'freelance', 'scholarship', 'gift', 'refund', 'investment_return', 'other_income',
  // Expense
  'food', 'transportation', 'entertainment', 'shopping', 'utilities', 'rent', 'education',
  'healthcare', 'subscriptions', 'groceries', 'dining_out', 'clothing', 'electronics',
  'travel', 'fitness', 'personal_care', 'gifts_donations', 'insurance', 'other_expense',
  // Investment
  'stocks', 'mutual_funds', 'crypto', 'fixed_deposit', 'gold', 'other_investment',
  // Transfer
  'savings_transfer', 'account_transfer', 'other_transfer'
];

function stripJsonFences(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function normalizeCategory(category, type) {
  if (ALLOWED_CATEGORIES.includes(category)) return category;
  if (type === 'income') return 'other_income';
  if (type === 'investment') return 'other_investment';
  if (type === 'transfer') return 'other_transfer';
  return 'other_expense';
}

function normalizePaymentMethod(method) {
  if (ALLOWED_PAYMENT_METHODS.includes(method)) return method;
  return 'other';
}

function normalizeType(type) {
  if (ALLOWED_TRANSACTION_TYPES.includes(type)) return type;
  return 'expense';
}

function crispOneLine(text, maxLen) {
  if (!text || typeof text !== 'string') return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLen) return normalized;
  const slice = normalized.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const base = lastSpace > 30 ? slice.slice(0, lastSpace) : slice;
  return `${base.trim()}…`;
}

async function callGeminiReceiptExtractor({ apiKey, images }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const prompt = [
    'You are an expert receipt and invoice parser for personal finance tracking.',
    'Extract transactions from the provided receipt images.',
    '',
    'Return ONLY valid JSON (no markdown). Schema:',
    '{',
    '  "transactions": [',
    '    {',
    '      "type": "expense" | "income" | "transfer" | "investment",',
    '      "amount": number,',
    '      "currency": string (default "INR"),',
    '      "category": string (must be one of the allowed categories),',
    '      "merchant": string,',
    '      "description": string,',
    '      "date": string in ISO 8601 (YYYY-MM-DD preferred),',
    '      "paymentMethod": string (one of allowed payment methods),',
    '      "notes": string,',
    '      "confidence": number between 0 and 1',
    '    }',
    '  ],',
    '  "warnings": string[]',
    '}',
    '',
    `Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`,
    `Allowed payment methods: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
    '',
    'Rules:',
    '- Amount must be positive (do not use negatives).',
    '- If a field is missing, leave it as an empty string or omit it, but keep amount/category/type when possible.',
    '- If unsure about category or paymentMethod, choose the closest allowed value.',
    '- If you see multiple line items but only one total, create ONE transaction for the total.',
  ].join('\n');

  const parts = [{ text: prompt }];
  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64
      }
    });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned no text content');
  }

  const cleaned = stripJsonFences(text);
  const parsed = safeJsonParse(cleaned);
  if (!parsed.ok) {
    throw new Error('Failed to parse Gemini JSON response');
  }

  return parsed.value;
}

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

// Import transactions from receipt/bill photos via Gemini
exports.importBills = async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured' });
    }

    const files = req.files || [];
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const images = files.map((f) => ({
      mimeType: f.mimetype || 'image/jpeg',
      base64: f.buffer.toString('base64')
    }));

    const extraction = await callGeminiReceiptExtractor({
      apiKey: process.env.GEMINI_API_KEY,
      images
    });

    const extracted = Array.isArray(extraction?.transactions) ? extraction.transactions : [];
    const warnings = Array.isArray(extraction?.warnings) ? extraction.warnings : [];

    if (extracted.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No transactions detected in the uploaded images',
        data: { created: [], warnings }
      });
    }

    const toCreate = [];
    for (const t of extracted) {
      const type = normalizeType(t?.type);
      const amount = Number(t?.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const category = normalizeCategory(t?.category, type);
      const currency = typeof t?.currency === 'string' && t.currency.trim() ? t.currency.trim().toUpperCase() : 'INR';
      const paymentMethod = normalizePaymentMethod(t?.paymentMethod);
      const date = t?.date ? new Date(t.date) : new Date();
      const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

      const rawMerchant = typeof t?.merchant === 'string' ? t.merchant : '';
      const rawDescription = typeof t?.description === 'string' ? t.description : '';
      const rawNotes = typeof t?.notes === 'string' ? t.notes : '';

      const merchant = crispOneLine(rawMerchant, 60).slice(0, 100);
      const description = crispOneLine(rawDescription || merchant, 80).slice(0, 500);

      // Preserve long item lists in notes (not in description)
      const longDescriptionRemainder = rawDescription && rawDescription.replace(/\s+/g, ' ').trim().length > 90
        ? rawDescription.replace(/\s+/g, ' ').trim().slice(0, 700)
        : '';

      const combinedNotes = [
        rawNotes,
        longDescriptionRemainder ? `Items/Details: ${longDescriptionRemainder}` : ''
      ].filter(Boolean).join('\n\n').slice(0, 1000);

      toCreate.push({
        student: student._id,
        type,
        amount,
        category,
        currency,
        merchant,
        description,
        notes: combinedNotes,
        paymentMethod,
        date: safeDate
      });
    }

    if (toCreate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No valid transactions could be created from the extraction',
        data: { created: [], warnings }
      });
    }

    const created = await Transaction.insertMany(toCreate);
    return res.status(201).json({
      success: true,
      message: `Imported ${created.length} transaction(s) successfully`,
      data: { created, warnings }
    });
  } catch (error) {
    console.error('Error importing bills:', error);
    return res.status(500).json({
      success: false,
      message: 'Error importing bills',
      error: error.message
    });
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
