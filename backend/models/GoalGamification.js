const mongoose = require('mongoose');

const goalGamificationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  earnedBadges: [{
    name: String,
    icon: String,
    date: { type: Date, default: Date.now },
    goalId: String // Optional context
  }],
  streaks: {
    type: Map,
    of: Number, // goalId -> streak count
    default: {}
  },
  totalMilestonesReached: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GoalGamification', goalGamificationSchema);
