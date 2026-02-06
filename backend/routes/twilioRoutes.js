const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/twilioController');

// Generate verification code for WhatsApp linking
// POST /api/whatsapp/generate-code
router.post('/generate-code', twilioController.generateWhatsAppCode);

// Check WhatsApp link status
// GET /api/whatsapp/status/:firebaseUid
router.get('/status/:firebaseUid', twilioController.getWhatsAppStatus);

// Unlink WhatsApp
// POST /api/whatsapp/unlink
router.post('/unlink', twilioController.unlinkWhatsApp);

// Twilio webhook for incoming WhatsApp messages
// POST /api/whatsapp/webhook
router.post('/webhook', twilioController.twilioWebhook);

module.exports = router;
