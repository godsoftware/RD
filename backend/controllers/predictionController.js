const { validationResult } = require('express-validator');
const demoAuth = require('../demoAuth');
const { predict, validateInput, getModelInfo } = require('../ml/loadModel');

// @desc    Make a new prediction
// @route   POST /api/prediction/predict
// @access  Private
const makePrediction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { inputData } = req.body;
    const userId = req.user.userId;

    // Validate input data
    await validateInput(inputData);

    // Create prediction record using demo auth
    const predictionData = {
      inputData,
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        fileName: req.body.fileName || null,
        fileSize: req.body.fileSize || null
      },
      modelVersion: '1.0'
    };

    const savedPrediction = demoAuth.createPrediction(userId, predictionData);

    try {
      // Make prediction using AI model
      const startTime = Date.now();
      const result = await predict(inputData);
      const processingTime = Date.now() - startTime;

      // Update prediction with results
      savedPrediction.result = {
        prediction: result.prediction,
        confidence: result.confidence,
        category: getCategoryFromPrediction(result.prediction)
      };
      savedPrediction.processingTime = processingTime;
      savedPrediction.status = 'completed';
      savedPrediction.updatedAt = new Date().toISOString();

      // User count is automatically updated in demoAuth.createPrediction
      const finalPrediction = savedPrediction;

      res.status(201).json({
        success: true,
        message: 'Prediction completed successfully',
        data: {
          prediction: finalPrediction,
          result: {
            prediction: result.prediction,
            confidence: result.confidence,
            category: getCategoryFromPrediction(result.prediction),
            processingTime: processingTime
          }
        }
      });

    } catch (predictionError) {
      // Mark prediction as failed
      savedPrediction.status = 'failed';
      savedPrediction.errorMessage = predictionError.message;
      savedPrediction.updatedAt = new Date().toISOString();
      
      throw predictionError;
    }

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed: ' + error.message
    });
  }
};

// @desc    Get user's prediction history
// @route   GET /api/prediction/history
// @access  Private
const getPredictionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Status filtering handled in demoAuth

    // Get predictions with pagination using demo auth
    const result = demoAuth.getUserPredictions(userId, page, limit);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction history'
    });
  }
};

// @desc    Get single prediction by ID
// @route   GET /api/prediction/:id
// @access  Private
const getPredictionById = async (req, res) => {
  try {
    const predictionId = req.params.id;
    const userId = req.user.userId;

    const prediction = await Prediction.findOne({
      _id: predictionId,
      user: userId
    }).populate('user', 'username email');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      data: {
        prediction
      }
    });

  } catch (error) {
    console.error('Get prediction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction'
    });
  }
};

// @desc    Get prediction statistics for user
// @route   GET /api/prediction/stats
// @access  Private
const getPredictionStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get stats using demo auth
    const stats = demoAuth.getPredictionStats(userId);

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get prediction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction statistics'
    });
  }
};

// @desc    Delete prediction
// @route   DELETE /api/prediction/:id
// @access  Private
const deletePrediction = async (req, res) => {
  try {
    const predictionId = req.params.id;
    const userId = req.user.userId;

    // Use demo auth to delete prediction
    const deleted = demoAuth.deletePrediction(predictionId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });

  } catch (error) {
    console.error('Delete prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prediction'
    });
  }
};

// @desc    Get model information
// @route   GET /api/prediction/model-info
// @access  Private
const getModelInformation = async (req, res) => {
  try {
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
};

// Helper function to categorize predictions
const getCategoryFromPrediction = (prediction) => {
  // This is a generic implementation - adjust based on your specific model output
  const categories = ['Low Risk', 'Medium Risk', 'High Risk'];
  
  if (prediction >= 0 && prediction < categories.length) {
    return categories[prediction];
  }
  
  return 'Unknown';
};

module.exports = {
  makePrediction,
  getPredictionHistory,
  getPredictionById,
  getPredictionStats,
  deletePrediction,
  getModelInformation
};
