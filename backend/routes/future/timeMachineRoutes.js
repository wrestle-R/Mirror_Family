const express = require('express');
const router = express.Router();
const timeMachineController = require('../../controllers/future/timeMachineController');

// GET /api/future/time-machine/:firebaseUid
router.get('/time-machine/:firebaseUid', timeMachineController.getProjection);

// POST /api/future/time-machine/generate
router.post('/time-machine/generate', timeMachineController.generateProjection);

module.exports = router;
