require('dotenv').config();

const express = require('express');
const path = require('path');
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
  // Skip debug endpoints
  skip: (req) => {
    return req.path.startsWith('/api/debug/') || req.path.startsWith('/api/cors-test');
  },
  // Custom key generator for development
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use(limiter);

// CORS middleware - Basit ve güvenli konfigürasyon
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Preflight requests için
app.options('*', cors());

// Request logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 ${timestamp} ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    contentType: req.headers['content-type'],
    authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'NO AUTH',
    bodySize: req.headers['content-length'] || 0
  });
  
  // Special logging for POST requests
  if (req.method === 'POST') {
    console.log(`🚀 POST REQUEST DETECTED:`, {
      path: req.path,
      hasFile: !!req.headers['content-type']?.includes('multipart'),
      hasAuth: !!req.headers.authorization
    });
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve TFJS model files over HTTP for frontend/CPU TFJS loading
// Example: http://localhost:5001/models/brain_tumor_tfjs/model.json
app.use('/models', express.static(path.join(__dirname, 'ml', 'models')));

// Initialize Firebase
(async () => {
  try {
    const healthCheck = await firebaseService.healthCheck();
    if (healthCheck.status === 'healthy') {
      console.log('✅ Firebase connected successfully');
      console.log('🔥 Using Firebase Firestore as database');
      console.log('🔐 Firebase Authentication enabled');
    } else {
      console.warn('⚠️ Firebase connection error:', healthCheck.message);
      console.warn('🚫 Server will continue with mock data mode');
      console.warn('🔍 Check /api/debug/env for configuration details');
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization error:', error.message);
    console.warn('🚫 Server will continue with mock data mode');
    console.warn('🔍 Check /api/debug/env for configuration details');
  }
})();

// Debug endpoint for environment variables
app.get('/api/debug/env', (req, res) => {
  const firebaseConfigComplete = !!(
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_PRIVATE_KEY && 
    process.env.FIREBASE_CLIENT_EMAIL
  );

  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '5001'
    },
    firebase: {
      PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET ✅' : 'NOT SET ❌',
      PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET ✅' : 'NOT SET ❌',
      CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET ✅' : 'NOT SET ❌',
      PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET ✅' : 'NOT SET ❌',
      CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? 'SET ✅' : 'NOT SET ❌',
      configurationComplete: firebaseConfigComplete ? 'COMPLETE ✅' : 'INCOMPLETE ❌',
      serviceInitialized: firebaseService.isInitialized ? 'INITIALIZED ✅' : 'NOT INITIALIZED ❌'
    },
    gemini: {
      API_KEY: process.env.GEMINI_API_KEY ? 'SET ✅' : 'NOT SET ❌'
    },
    cors: {
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
    },
    dataMode: firebaseService.isInitialized ? 'REAL DATA' : 'MOCK DATA',
    instructions: firebaseService.isInitialized ? 
      'Firebase connected! Using real data.' : 
      'Firebase not configured. See FIREBASE_CONFIG_INSTRUCTIONS.md for setup.'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    }
  });
});

// Firestore debug endpoint
app.get('/api/debug/firestore', async (req, res) => {
  try {
    if (!firebaseService.isInitialized) {
      return res.json({
        success: false,
        message: 'Firebase not initialized',
        firebaseStatus: {
          isInitialized: firebaseService.isInitialized,
          hasDb: !!firebaseService.db,
          hasAuth: !!firebaseService.auth
        }
      });
    }

    // Check predictions collection
    const predictionsSnapshot = await firebaseService.db.collection('predictions').limit(10).get();
    const predictions = [];
    
    predictionsSnapshot.forEach(doc => {
      const data = doc.data();
      predictions.push({
        id: doc.id,
        userId: data.userId,
        prediction: data.prediction || data.result?.prediction || 'N/A',
        status: data.status || 'unknown',
        createdAt: data.createdAt ? data.createdAt.toDate?.() || data.createdAt : 'N/A'
      });
    });

    // Check users collection
    const usersSnapshot = await firebaseService.db.collection('users').limit(5).get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        username: data.username,
        createdAt: data.createdAt ? data.createdAt.toDate?.() || data.createdAt : 'N/A'
      });
    });

    res.json({
      success: true,
      message: 'Firestore debug info',
      firebaseStatus: {
        isInitialized: firebaseService.isInitialized,
        hasDb: !!firebaseService.db,
        hasAuth: !!firebaseService.auth
      },
      collections: {
        predictions: {
          total: predictions.length,
          documents: predictions
        },
        users: {
          total: users.length,
          documents: users
        }
      }
    });

  } catch (error) {
    console.error('Firestore debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Firestore debug failed',
      error: error.message
    });
  }
});

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