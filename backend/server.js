const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const agentRoutes = require('./routes/agentRoutes');
const copilotRoutes = require('./routes/copilotRoutes');
const groupRoutes = require('./routes/groupRoutes');
const stockRoutes = require('./routes/stockRoutes');
const goalAnalysisRoutes = require('./routes/goalAnalysisRoutes');
const timeMachineRoutes = require('./routes/future/timeMachineRoutes');
const synthesisRoutes = require('./routes/synthesisRoutes');
const twilioRoutes = require('./routes/twilioRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio webhook (form-urlencoded)

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/goal-analysis', goalAnalysisRoutes);
app.use('/api/future', timeMachineRoutes);
app.use('/api/synthesis', synthesisRoutes);
app.use('/api/whatsapp', twilioRoutes);


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// app.use('/api/auth', authRoutes); // Moved to top


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
  });
});

app.use((req, res) => {
  console.log('404 - Route not found:', req.path);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
