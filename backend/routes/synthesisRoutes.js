const express = require('express');
const router = express.Router();
const synthesisController = require('../controllers/synthesisController');

// GET synthesis video briefing data
router.get('/:firebaseUid', synthesisController.getSynthesis);

module.exports = router;
