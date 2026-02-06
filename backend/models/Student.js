const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  contactNumber: {
    type: String,
    default: null
  },
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

studentSchema.pre('save', function(next) {
  console.log('Saving student:', this.email);
  next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
