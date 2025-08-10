const express = require('express');
// Removed MongoDB dependency for demo
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Check if demo mode is enabled
if (process.env.DEMO_MODE === 'true') {
  console.log('🚀 Demo Mode: Using in-memory storage');
  console.log('📧 Demo Account: demo@medical.com');  
  console.log('🔑 Demo Password: demo123');
  console.log('👨‍⚕️ Doctor Account: doctor@medical.com');
  console.log('🔑 Doctor Password: demo123');
} else {
  // MongoDB Connection - Real Database
  const mongoose = require('mongoose');
  
  const connectDB = async () => {
    try {
      const mongoURI = process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI 
        : process.env.MONGODB_URI_DEV;
      
      console.log('🔗 Connecting to MongoDB...');
      
      const conn = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      process.exit(1);
    }
  };

  // Connect to database
  connectDB();
}

// Routes
app.use('/api', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/prediction', require('./routes/prediction'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
