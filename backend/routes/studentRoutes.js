const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/profile/:firebaseUid', studentController.getProfile);
router.post('/profile', studentController.updateProfile);

module.exports = router;
