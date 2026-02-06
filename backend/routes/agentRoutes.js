const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.get('/:type/:firebaseUid', agentController.getAgentData);
router.post('/generate', agentController.generateAgentData);

module.exports = router;
