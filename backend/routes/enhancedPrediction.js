const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { firebaseAuth, authenticateToken } = require('../middleware/firebaseAuth');
const { upload, handleMulterError } = require('../middleware/upload');
const {
  makeEnhancedPrediction,
  getEnhancedPredictionHistory,
  getEnhancedPredictionById,
  getEnhancedPredictionStats,
  deleteEnhancedPrediction,
  getHealthRecommendations
} = require('../controllers/enhancedPredictionController');

// Validation middleware for enhanced predictions
const predictionValidation = [
  body('patientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient name must be between 2 and 100 characters'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('weight')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Weight must be between 1 and 500 kg'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('modelType')
    .optional()
    .isIn(['pneumonia', 'brainTumor', 'tuberculosis', 'auto'])
    .withMessage('Invalid model type'),
  
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Symptoms cannot exceed 1000 characters'),
  
  body('medicalHistory')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Medical history cannot exceed 2000 characters')
];

const recommendationsValidation = [
  body('patientData')
    .notEmpty()
    .withMessage('Patient data is required')
    .isObject()
    .withMessage('Patient data must be an object')
];

// @desc    Make enhanced prediction with Gemini AI
// @route   POST /api/prediction/enhanced
// @access  Private
router.post('/enhanced', 
  authenticateToken, // Authentication required for creating predictions
  upload.single('file'),
  handleMulterError,
  predictionValidation,
  makeEnhancedPrediction
);

// @desc    Get enhanced prediction statistics
// @route   GET /api/prediction/enhanced/stats
// @access  Private
router.get('/enhanced/stats', authenticateToken, getEnhancedPredictionStats);

// @desc    Get enhanced prediction history
// @route   GET /api/prediction/enhanced/history
// @access  Private
router.get('/enhanced/history', authenticateToken, getEnhancedPredictionHistory);

// @desc    Get single enhanced prediction
// @route   GET /api/prediction/enhanced/:id
// @access  Private
router.get('/enhanced/:id', authenticateToken, getEnhancedPredictionById);

// @desc    Delete enhanced prediction
// @route   DELETE /api/prediction/enhanced/:id
// @access  Private
router.delete('/enhanced/:id', authenticateToken, deleteEnhancedPrediction);

// @desc    Get health recommendations using Gemini AI
// @route   POST /api/prediction/recommendations
// @access  Private
router.post('/recommendations', 
  authenticateToken,
  recommendationsValidation,
  getHealthRecommendations
);

// Model information endpoint
router.get('/model-info', authenticateToken, (req, res) => {
  try {
    const { getModelInfo } = require('../ml/loadModel');
    const modelInfo = getModelInfo();
    
    res.json({
      success: true,
      data: {
        modelInfo
      }
    });
  } catch (error) {
    console.error('Get model info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve model information'
    });
  }
});

// Main prediction endpoints (enhanced Firebase versions)
router.post('/predict', 
  authenticateToken,
  upload.single('file'),
  handleMulterError,
  predictionValidation,
  makeEnhancedPrediction
);

router.get('/stats', authenticateToken, getEnhancedPredictionStats);
router.get('/history', authenticateToken, getEnhancedPredictionHistory);
router.get('/:id', authenticateToken, getEnhancedPredictionById);
router.delete('/:id', authenticateToken, deleteEnhancedPrediction);

module.exports = router;
