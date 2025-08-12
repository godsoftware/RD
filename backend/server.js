require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const firebaseService = require('./services/firebaseService');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy for rate limiting (development için)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting - updated configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful responses for better UX
  skipSuccessfulRequests: false,
  // Custom key generator for development
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
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

// Initialize Firebase
(async () => {
  try {
    const healthCheck = await firebaseService.healthCheck();
    if (healthCheck.status === 'healthy') {
      console.log('✅ Firebase connected successfully');
      console.log('🔥 Using Firebase Firestore as database');
      console.log('🔐 Firebase Authentication enabled');
    } else {
      console.error('❌ Firebase connection error:', healthCheck.message);
      process.exit(1); // Exit if Firebase is not configured
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    process.exit(1);
  }
})();

// Routes - Firebase only
app.use('/api', require('./routes/index'));
app.use('/api/auth', require('./routes/enhancedAuth'));
app.use('/api/prediction', require('./routes/enhancedPrediction'));
app.use('/api/patients', require('./routes/patients'));

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