const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Group management routes
router.post('/', groupController.createGroup);
router.get('/:firebaseUid', groupController.getUserGroups);
router.get('/details/:groupId', groupController.getGroupDetails);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Member management routes
router.post('/join', groupController.joinGroupByCode);
router.post('/:groupId/members/:memberId/remove', groupController.removeMember);
router.post('/:groupId/leave', groupController.leaveGroup);

// Expense management routes
router.post('/:groupId/expenses', groupController.createExpense);
router.get('/:groupId/expenses', groupController.getGroupExpenses);
router.put('/:groupId/expenses/:expenseId', groupController.updateExpense);
router.delete('/:groupId/expenses/:expenseId', groupController.deleteExpense);

// Balance and settlement// Balances
router.get('/:groupId/balances', groupController.getGroupBalances);
router.post('/:groupId/settle', groupController.settleBalance);

// Settle all simplified settlements
router.post('/:groupId/settle-all', groupController.settleAll);

// Group transactions
router.get('/:groupId/transactions', groupController.getGroupTransactions);

// Analytics
router.get('/:groupId/analytics', groupController.getGroupAnalytics);

// Settle expense (legacy - keeping for backward compatibility)
router.post('/:groupId/expenses/:expenseId/settle', groupController.settleExpense);

module.exports = router;
