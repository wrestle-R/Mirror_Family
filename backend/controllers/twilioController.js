const twilio = require('twilio');
const crypto = require('crypto');
const { VerificationCode, WhatsAppLink } = require('../models/WhatsAppLink');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

console.log('🔧 Twilio Configuration:');
console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '***' + process.env.TWILIO_AUTH_TOKEN.substring(process.env.TWILIO_AUTH_TOKEN.length - 4) : 'NOT SET'}`);
console.log(`   WhatsApp Number: ${TWILIO_WHATSAPP_NUMBER}`);

// Valid categories from Transaction model
const VALID_CATEGORIES = [
  // Income categories
  'salary', 'allowance', 'freelance', 'scholarship', 'gift', 'refund', 'investment_return', 'other_income',
  // Expense categories
  'food', 'transportation', 'entertainment', 'shopping', 'utilities', 'rent', 'education',
  'healthcare', 'subscriptions', 'groceries', 'dining_out', 'clothing', 'electronics',
  'travel', 'fitness', 'personal_care', 'gifts_donations', 'insurance', 'other_expense',
  // Investment categories
  'stocks', 'mutual_funds', 'crypto', 'fixed_deposit', 'gold', 'other_investment',
  // Transfer categories
  'savings_transfer', 'account_transfer', 'other_transfer'
];

const VALID_TYPES = ['income', 'expense', 'transfer', 'investment'];

// Generate 8-character alphanumeric code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Send WhatsApp message via Twilio
const sendWhatsAppMessage = async (to, message) => {
  console.log(`📤 Attempting to send WhatsApp message...`);
  console.log(`   From: ${TWILIO_WHATSAPP_NUMBER}`);
  console.log(`   To: ${to}`);
  console.log(`   Message length: ${message.length} chars`);
  
  try {
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: to,
      body: message
    });
    
    console.log(`✅ Twilio API Response:`);
    console.log(`   SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Direction: ${result.direction}`);
    console.log(`   Error Code: ${result.errorCode || 'none'}`);
    console.log(`   Error Message: ${result.errorMessage || 'none'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Status:', error.status);
    console.error('   More Info:', error.moreInfo);
    console.error('   Full Error:', JSON.stringify(error, null, 2));
    throw error;
  }
};

// Generate verification code for WhatsApp linking
const generateWhatsAppCode = async (req, res) => {
  try {
    const { firebaseUid, email } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID and email are required'
      });
    }

    // Verify the student exists
    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if already linked
    const existingLink = await WhatsAppLink.findOne({ firebaseUid });
    if (existingLink && existingLink.isActive) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp is already linked to this account',
        data: { isLinked: true }
      });
    }

    // Delete any existing codes for this user
    await VerificationCode.deleteMany({ firebaseUid });

    // Generate new code
    const code = generateCode();

    // Store the verification code (will auto-expire in 5 minutes via TTL)
    await VerificationCode.create({
      code,
      email: email.toLowerCase(),
      firebaseUid
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code generated successfully',
      data: {
        code,
        expiresIn: 300, // 5 minutes in seconds
        instructions: `Send "LINK ${email} ${code}" to ${TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', '')} on WhatsApp`
      }
    });
  } catch (error) {
    console.error('Error generating WhatsApp code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate verification code'
    });
  }
};

// Check WhatsApp link status
const getWhatsAppStatus = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }

    const link = await WhatsAppLink.findOne({ firebaseUid, isActive: true });

    return res.status(200).json({
      success: true,
      data: {
        isLinked: !!link,
        phoneNumber: link ? link.phoneNumber : null,
        linkedAt: link ? link.linkedAt : null
      }
    });
  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check WhatsApp status'
    });
  }
};

// Unlink WhatsApp
const unlinkWhatsApp = async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }

    const link = await WhatsAppLink.findOneAndUpdate(
      { firebaseUid },
      { isActive: false },
      { new: true }
    );

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'No WhatsApp link found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'WhatsApp unlinked successfully'
    });
  } catch (error) {
    console.error('Error unlinking WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlink WhatsApp'
    });
  }
};

// Parse transaction message: "type, category, amount, description"
const parseTransactionMessage = (message) => {
  console.log(`🔍 Parsing message: "${message}"`);
  const parts = message.split(',').map(part => part.trim());

  if (parts.length < 3) {
    return { 
      error: 'Not enough information. Need at least: type, category, amount\n\n' +
             'You sent: ' + message.substring(0, 50) + '\n\n' +
             'Make sure to use commas (,) to separate each part.'
    };
  }

  const [type, category, amountStr, ...descriptionParts] = parts;
  const description = descriptionParts.join(', ') || '';

  console.log(`  Type: "${type}", Category: "${category}", Amount: "${amountStr}", Description: "${description}"`);

  // Validate type
  const normalizedType = type.toLowerCase();
  if (!VALID_TYPES.includes(normalizedType)) {
    return { 
      error: `Invalid type: "${type}"\n\n` +
             'Valid types are:\n' +
             '• income - Money you receive\n' +
             '• expense - Money you spend\n' +
             '• transfer - Moving money between accounts\n' +
             '• investment - Investing money\n\n' +
             'Example: expense, food, 500, Lunch'
    };
  }

  // Validate and normalize category
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  if (!VALID_CATEGORIES.includes(normalizedCategory)) {
    // Try to find a close match
    const closeMatch = VALID_CATEGORIES.find(c =>
      c.includes(normalizedCategory) || normalizedCategory.includes(c.replace('_', ''))
    );
    if (!closeMatch) {
      return { 
        error: `Invalid category: "${category}"\n\n` +
               'Common categories:\n' +
               'Income: salary, allowance, freelance, scholarship\n' +
               'Expense: food, transportation, entertainment, shopping, rent, education\n' +
               'Investment: stocks, mutual_funds, crypto\n\n' +
               'Example: expense, food, 500, Lunch'
      };
    }
  }

  // Validate amount
  const amount = parseFloat(amountStr.replace(/[₹,]/g, ''));
  if (isNaN(amount) || amount <= 0) {
    return { 
      error: `Invalid amount: "${amountStr}"\n\n` +
             'Amount must be a positive number.\n\n' +
             'Examples: 500, 1000, 2500.50\n' +
             'You can also use: ₹500 or 1,000'
    };
  }

  console.log(`✅ Parse successful - Type: ${normalizedType}, Category: ${normalizedCategory}, Amount: ${amount}`);

  return {
    type: normalizedType,
    category: VALID_CATEGORIES.includes(normalizedCategory) ? normalizedCategory : 'other_expense',
    amount,
    description
  };
};

// Handle linking request
const handleLinkRequest = async (whatsappChatId, phoneNumber, messageBody) => {
  console.log(`🔗 LINK request received: "${messageBody}"`);
  
  // Expected format: LINK email@example.com CODE1234
  const linkMatch = messageBody.match(/^LINK\s+(\S+@\S+)\s+([A-Z0-9]{8})$/i);

  if (!linkMatch) {
    console.error('❌ Invalid LINK format:', messageBody);
    return '❌ Invalid linking format.\n\n' +
           'Correct format:\n' +
           'LINK your-email@example.com YOUR_CODE\n\n' +
           'Example:\n' +
           'LINK test@gmail.com ABC12345\n\n' +
           'Make sure:\n' +
           '• Email and code are separated by spaces\n' +
           '• Code is exactly 8 characters\n' +
           '• No extra spaces or characters';
  }

  const [, email, code] = linkMatch;
  console.log(`📧 Attempting to link email: ${email}, code: ${code}`);

  // Find the verification code
  const verification = await VerificationCode.findOne({
    code: code.toUpperCase(),
    email: email.toLowerCase()
  });

  if (!verification) {
    console.error(`❌ Code not found or expired: ${code} for email ${email}`);
    return '❌ Invalid or expired code.\n\n' +
           'This could mean:\n' +
           '• The code has expired (valid for 5 minutes)\n' +
           '• The code is incorrect\n' +
           '• The email doesn\'t match\n\n' +
           'Please generate a new code from your MoneyCouncil Profile page.';
  }

  console.log(`✅ Verification code found for firebaseUid: ${verification.firebaseUid}`);

  // Check if this WhatsApp number is already linked to another account
  const existingLink = await WhatsAppLink.findOne({
    whatsappChatId,
    isActive: true
  });

  if (existingLink && existingLink.firebaseUid !== verification.firebaseUid) {
    console.error(`❌ WhatsApp already linked to different account: ${existingLink.firebaseUid}`);
    return '❌ This WhatsApp number is already linked to another account.\n\n' +
           'If you want to link a different account, first send "unlink" to disconnect the current one.';
  }

  // Create or update the WhatsApp link
  const linkedAccount = await WhatsAppLink.findOneAndUpdate(
    { firebaseUid: verification.firebaseUid },
    {
      whatsappChatId,
      phoneNumber,
      email: email.toLowerCase(),
      isActive: true,
      linkedAt: new Date()
    },
    { upsert: true, new: true }
  );

  // Delete the used verification code
  await VerificationCode.deleteOne({ _id: verification._id });

  console.log(`✅ Successfully linked WhatsApp ${phoneNumber} to ${verification.firebaseUid}`);
  
  return '✅ Success! Your WhatsApp is now linked to MoneyCouncil.\n\n' +
         '📱 What you can do now:\n\n' +
         '💸 Add transactions:\n' +
         '  expense, food, 500, Lunch\n' +
         '  income, salary, 50000, Monthly salary\n\n' +
         '📋 View history:\n' +
         '  get transactions\n\n' +
         '❓ Get help anytime:\n' +
         '  help';
};

// Handle transaction creation
const handleAddTransaction = async (firebaseUid, messageBody) => {
  console.log(`💰 Parsing transaction: "${messageBody}"`);
  const parsed = parseTransactionMessage(messageBody);

  if (parsed.error) {
    console.error(`❌ Transaction parse error: ${parsed.error}`);
    return `❌ ${parsed.error}\n\n` +
           'Correct format: type, category, amount, description\n\n' +
           'Examples:\n' +
           '• expense, food, 500, Lunch\n' +
           '• income, salary, 50000, Monthly salary\n' +
           '• expense, transportation, 200, Uber ride\n\n' +
           'Type "help" for more information.';
  }

  // Get the student
  const student = await Student.findOne({ firebaseUid });
  if (!student) {
    console.error(`❌ Student not found for firebaseUid: ${firebaseUid}`);
    return '❌ Account not found. Please re-link your WhatsApp.';
  }

  console.log(`✅ Creating transaction for student ${student._id}`);
  
  // Create the transaction
  const transaction = new Transaction({
    student: student._id,
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    date: new Date(),
    paymentMethod: 'other',
    notes: 'Added via WhatsApp'
  });

  await transaction.save();
  console.log(`✅ Transaction saved with ID: ${transaction._id}`);

  const typeEmoji = parsed.type === 'income' ? '💰' : parsed.type === 'expense' ? '💸' : '📊';
  return `${typeEmoji} Transaction added!\n\n• Type: ${parsed.type}\n• Category: ${parsed.category.replace('_', ' ')}\n• Amount: ₹${parsed.amount.toLocaleString('en-IN')}\n• Description: ${parsed.description || 'N/A'}`;
};

// Handle get transactions request
const handleGetTransactions = async (firebaseUid) => {
  const student = await Student.findOne({ firebaseUid });
  if (!student) {
    return '❌ Account not found. Please re-link your WhatsApp.';
  }

  const transactions = await Transaction.find({ student: student._id })
    .sort({ date: -1 })
    .limit(10);

  if (transactions.length === 0) {
    return '📋 No transactions found. Add your first transaction by sending:\nexpense, food, 500, Lunch with friends';
  }

  let response = '📋 Your Last 10 Transactions:\n\n';
  transactions.forEach((tx, index) => {
    const date = new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const typeEmoji = tx.type === 'income' ? '💰' : tx.type === 'expense' ? '💸' : '📊';
    response += `${index + 1}. ${date} - ${tx.category.replace('_', ' ')} ₹${tx.amount.toLocaleString('en-IN')} ${typeEmoji}\n`;
  });

  return response;
};

// Main webhook handler for incoming WhatsApp messages
const twilioWebhook = async (req, res) => {
  console.log('=== TWILIO WEBHOOK RECEIVED ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { From, Body } = req.body;

    if (!From || !Body) {
      console.error('❌ Missing From or Body in request:', { From, Body });
      // Still return 200 to Twilio to avoid retries
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    const whatsappChatId = From; // Format: whatsapp:+919137218364
    const phoneNumber = From.replace('whatsapp:', '');
    const messageBody = Body.trim();

    console.log(`📱 WhatsApp message from ${phoneNumber}: "${messageBody}"`);

    let responseMessage = '';

    // Check if user is linked
    const link = await WhatsAppLink.findOne({ whatsappChatId, isActive: true });
    console.log(`🔗 User link status:`, link ? `Linked to ${link.firebaseUid}` : 'Not linked');

    if (!link) {
      // Not linked - only accept LINK command
      if (messageBody.toUpperCase().startsWith('LINK')) {
        console.log('🔑 Processing LINK command...');
        responseMessage = await handleLinkRequest(whatsappChatId, phoneNumber, messageBody);
      } else {
        console.log('ℹ️ User not linked, sending welcome message');
        responseMessage = '👋 Welcome to MoneyCouncil!\n\nTo get started, link your account:\n1. Go to your MoneyCouncil Profile\n2. Click "Generate WhatsApp Code"\n3. Send: LINK your-email@example.com CODE\n\nExample:\nLINK test@gmail.com ABC12345';
      }
    } else {
      // User is linked - handle commands
      const lowerMessage = messageBody.toLowerCase();
      console.log(`✅ Processing command from linked user: "${lowerMessage}"`);

      if (lowerMessage === 'get transactions' || lowerMessage === 'history' || lowerMessage === 'transactions') {
        responseMessage = await handleGetTransactions(link.firebaseUid);
      } else if (lowerMessage === 'help' || lowerMessage === 'commands') {
        responseMessage = '📖 MoneyCouncil WhatsApp Commands:\n\n' +
                         '💸 Add Transaction:\n' +
                         '  Format: type, category, amount, description\n' +
                         '  Example: expense, food, 500, Lunch with friends\n' +
                         '  Example: income, salary, 50000, Monthly salary\n\n' +
                         '📋 View History:\n' +
                         '  - get transactions\n' +
                         '  - history\n' +
                         '  - transactions\n\n' +
                         '❓ Get Help:\n' +
                         '  - help\n' +
                         '  - commands\n\n' +
                         '🔓 Unlink Account:\n' +
                         '  - unlink\n\n' +
                         'Valid types: income, expense, transfer, investment\n' +
                         'Common categories: food, transportation, entertainment, shopping, salary, freelance';
      } else if (lowerMessage === 'unlink') {
        await WhatsAppLink.findOneAndUpdate(
          { whatsappChatId },
          { isActive: false }
        );
        responseMessage = '✅ Your WhatsApp has been unlinked from MoneyCouncil.';
      } else {
        // Assume it's a transaction
        console.log('💰 Attempting to parse as transaction...');
        responseMessage = await handleAddTransaction(link.firebaseUid, messageBody);
      }
    }

    console.log(`📤 Sending response: "${responseMessage.substring(0, 100)}..."`);
    
    // Send response via Twilio
    await sendWhatsAppMessage(whatsappChatId, responseMessage);
    console.log('✅ Message sent successfully');

    // Return empty TwiML (we're sending response via API)
    res.set('Content-Type', 'text/xml');
    return res.send('<Response></Response>');
  } catch (error) {
    console.error('❌ ERROR in Twilio webhook:', error);
    console.error('Error stack:', error.stack);
    
    // Try to send error message to user
    try {
      if (req.body?.From) {
        await sendWhatsAppMessage(
          req.body.From,
          '❌ Sorry, something went wrong processing your message. Please try again or type "help" for assistance.'
        );
      }
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError);
    }
    
    // Always return 200 to Twilio to avoid retries
    res.set('Content-Type', 'text/xml');
    return res.send('<Response></Response>');
  }
};

module.exports = {
  generateWhatsAppCode,
  getWhatsAppStatus,
  unlinkWhatsApp,
  twilioWebhook,
  sendWhatsAppMessage
};
