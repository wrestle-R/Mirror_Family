const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions for a student (with filtering)
router.get('/:firebaseUid', transactionController.getTransactions);

// Get transaction statistics
router.get('/stats/:firebaseUid', transactionController.getTransactionStats);

// Get monthly comparison
router.get('/monthly/:firebaseUid', transactionController.getMonthlyComparison);

// Get a single transaction
router.get('/single/:transactionId', transactionController.getTransaction);

// Update a transaction
router.put('/:transactionId', transactionController.updateTransaction);

// Delete a transaction
router.delete('/:transactionId', transactionController.deleteTransaction);

module.exports = router;
