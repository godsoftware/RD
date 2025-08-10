const express = require('express');
const router = express.Router();

// @desc    API health check
// @route   GET /api/
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RD Prediction API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password'
      },
      prediction: {
        predict: 'POST /api/prediction/predict',
        history: 'GET /api/prediction/history',
        getById: 'GET /api/prediction/:id',
        stats: 'GET /api/prediction/stats',
        delete: 'DELETE /api/prediction/:id',
        modelInfo: 'GET /api/prediction/model-info'
      }
    }
  });
});

// @desc    API status and system information
// @route   GET /api/status
// @access  Public
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    uptime: process.uptime(),
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

module.exports = router;
