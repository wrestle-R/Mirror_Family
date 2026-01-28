const express = require('express');
const router = express.Router();
const copilotController = require('../controllers/copilotController');

// GET context for copilot sidebar
router.get('/context/:firebaseUid', copilotController.getCopilotContext);

// POST chat message
router.post('/chat', copilotController.sendCopilotMessage);

module.exports = router;
