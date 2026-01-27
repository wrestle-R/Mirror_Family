const express = require('express');
const router = express.Router();
const { 
  createOrUpdateStudent, 
  getStudent, 
  updateOnboardingStatus 
} = require('../controllers/authController');

router.post('/student', createOrUpdateStudent);

router.get('/student/:firebaseUid', getStudent);

router.patch('/student/:firebaseUid/onboarding', updateOnboardingStatus);

console.log('Auth routes loaded');

module.exports = router;
