const express = require('express');
const router = express.Router();
const multer = require('multer');
const transactionController = require('../controllers/transactionController');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 8 * 1024 * 1024,
		files: 8
	}
});

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Import transactions from receipt images
router.post('/import-bills', upload.array('images', 8), transactionController.importBills);

// Get transaction statistics
router.get('/stats/:firebaseUid', transactionController.getTransactionStats);

// Get monthly comparison
router.get('/monthly/:firebaseUid', transactionController.getMonthlyComparison);

// Get all transactions for a student (with filtering)
router.get('/:firebaseUid', transactionController.getTransactions);

// Get a single transaction
router.get('/single/:transactionId', transactionController.getTransaction);

// Update a transaction
router.put('/:transactionId', transactionController.updateTransaction);

// Delete a transaction
router.delete('/:transactionId', transactionController.deleteTransaction);

module.exports = router;
