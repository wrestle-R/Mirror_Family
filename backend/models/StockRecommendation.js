const mongoose = require('mongoose');

const stockRecommendationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  // User preferences from questionnaire
  preferences: {
    investmentHorizon: {
      type: String,
      enum: ['short', 'medium', 'long'],
      required: true
    },
    riskAppetite: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      required: true
    },
    investmentAmount: {
      type: Number,
      required: true
    },
    sectors: [{
      type: String
    }],
    investmentGoal: {
      type: String,
      required: true
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    }
  },
  // AI-generated recommendations
  recommendations: [{
    symbol: String,
    name: String,
    sector: String,
    currentPrice: Number,
    recommendedAction: String, // buy, hold, watch
    allocation: Number, // percentage of portfolio
    rationale: String,
    targetPrice: Number,
    stopLoss: Number,
    timeHorizon: String,
    riskLevel: String,
    marketData: {
      change: Number,
      changePercent: Number,
      volume: Number,
      marketCap: Number,
      peRatio: Number,
      week52High: Number,
      week52Low: Number
    }
  }],
  // Portfolio analysis
  portfolioAnalysis: {
    diversificationScore: Number,
    riskScore: Number,
    expectedReturn: Number,
    summary: String,
    strengths: [String],
    warnings: [String]
  },
  // Market insights
  marketInsights: {
    summary: String,
    trends: [String],
    opportunities: [String]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
stockRecommendationSchema.index({ student: 1, lastUpdated: -1 });

const StockRecommendation = mongoose.model('StockRecommendation', stockRecommendationSchema);

module.exports = StockRecommendation;
