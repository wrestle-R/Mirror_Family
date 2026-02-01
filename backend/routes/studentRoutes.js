const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Profile routes
router.get('/profile/:firebaseUid', studentController.getProfile);
router.post('/profile', studentController.updateProfile);

// Voice onboarding
router.post('/voice-onboarding', studentController.voiceOnboarding);

// Income recording
router.post('/record-monthly-income', studentController.recordMonthlyIncome);

// Goal routes
router.get('/goals/:firebaseUid', studentController.getGoals);
router.post('/goals', studentController.addGoal);
router.put('/goals', studentController.updateGoal);
router.post('/goals/toggle', studentController.toggleGoalCompletion);
router.delete('/goals', studentController.deleteGoal);

module.exports = router;
