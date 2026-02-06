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

// All specific POST routes first
router.post('/', transactionController.createTransaction);
router.post('/import-bills', upload.array('images', 8), transactionController.importBills);
router.post('/bulk', transactionController.createBulkTransactions);

// Then specific GET routes
router.get('/stats/:firebaseUid', transactionController.getTransactionStats);
router.get('/monthly/:firebaseUid', transactionController.getMonthlyComparison);
router.get('/single/:transactionId', transactionController.getTransaction);

// Then general routes (must be last as they match broader patterns)
router.get('/:firebaseUid', transactionController.getTransactions);
router.put('/:transactionId', transactionController.updateTransaction);
router.delete('/:transactionId', transactionController.deleteTransaction);

module.exports = router;
