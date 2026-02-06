const mongoose = require('mongoose');

// Schema for verification codes (with TTL for 5-minute expiry)
const verificationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  firebaseUid: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // TTL: 5 minutes (300 seconds)
  }
});

// Schema for linked WhatsApp accounts
const whatsAppLinkSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  whatsappChatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  linkedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);
const WhatsAppLink = mongoose.model('WhatsAppLink', whatsAppLinkSchema);

module.exports = { VerificationCode, WhatsAppLink };
