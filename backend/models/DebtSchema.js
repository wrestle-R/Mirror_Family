const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    interestRate: {
        type: Number,
        required: true,
        default: 0.12 // 12% as default
    },
    minPayment: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: String,
        enum: ['credit_card', 'student_loan', 'personal_loan', 'car_loan', 'mortgage', 'other'],
        default: 'other'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

module.exports = debtSchema;
