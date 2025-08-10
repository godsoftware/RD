const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  makePrediction,
  getPredictionHistory,
  getPredictionById,
  getPredictionStats,
  deletePrediction,
  getModelInformation
} = require('../controllers/predictionController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validatePrediction,
  validatePagination,
  validateObjectId,
  sanitizeInput
} = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'text/csv',
      'application/json',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, CSV, JSON, TXT'), false);
    }
  }
});

// Apply input sanitization to all routes
router.use(sanitizeInput);

// @desc    Make a new prediction
// @route   POST /api/prediction/predict
// @access  Private
router.post('/predict', 
  authenticate, 
  upload.single('file'), // Optional file upload
  validatePrediction, 
  makePrediction
);

// @desc    Get user's prediction history with pagination
// @route   GET /api/prediction/history
// @access  Private
router.get('/history', 
  authenticate, 
  validatePagination, 
  getPredictionHistory
);

// @desc    Get prediction statistics for user
// @route   GET /api/prediction/stats
// @access  Private
router.get('/stats', 
  authenticate, 
  getPredictionStats
);

// @desc    Get model information
// @route   GET /api/prediction/model-info
// @access  Private
router.get('/model-info', 
  authenticate, 
  getModelInformation
);

// @desc    Get single prediction by ID
// @route   GET /api/prediction/:id
// @access  Private
router.get('/:id', 
  authenticate, 
  validateObjectId('id'), 
  getPredictionById
);

// @desc    Delete prediction
// @route   DELETE /api/prediction/:id
// @access  Private
router.delete('/:id', 
  authenticate, 
  validateObjectId('id'), 
  deletePrediction
);

// Error handling middleware for file upload
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;
