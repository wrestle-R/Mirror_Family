const mongoose = require('mongoose');

// Goal schema for both short-term and long-term goals
const goalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },
  targetAmount: {
    type: Number,
    default: 0
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['savings', 'purchase', 'investment', 'education', 'travel', 'emergency', 'debt_repayment', 'other'],
    default: 'savings'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

module.exports = goalSchema;
