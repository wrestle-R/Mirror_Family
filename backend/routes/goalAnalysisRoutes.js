const express = require('express');
const router = express.Router();
const goalAnalysisController = require('../controllers/goalAnalysisController');

router.post('/analyze-goal', goalAnalysisController.analyzeGoal);

module.exports = router;
