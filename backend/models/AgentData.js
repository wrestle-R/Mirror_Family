const mongoose = require('mongoose');

const agentDataSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
    type: String,
    enum: ['budget', 'savings', 'debt', 'investment', 'time-machine'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Stores the JSON structure returned by the AI
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one entry per type per student
agentDataSchema.index({ student: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('AgentData', agentDataSchema);
