require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('Testing Twilio WhatsApp Configuration:');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('From Number:', process.env.TWILIO_WHATSAPP_NUMBER);
console.log('To Number: whatsapp:+919137218364');
console.log('---');

client.messages
  .create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: 'whatsapp:+919137218364',
    body: '🧪 Test message from MoneyCouncil! If you see this, WhatsApp integration is working!'
  })
  .then(message => {
    console.log('✅ SUCCESS!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Direction:', message.direction);
    console.log('Error Code:', message.errorCode || 'none');
    console.log('Error Message:', message.errorMessage || 'none');
  })
  .catch(error => {
    console.error('❌ ERROR!');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.status);
    console.error('More Info:', error.moreInfo);
  });
