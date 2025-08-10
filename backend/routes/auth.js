const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateProfileUpdate, 
  validatePasswordChange,
  sanitizeInput 
} = require('../middleware/validation');

// Apply input sanitization to all routes
router.use(sanitizeInput);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegistration, registerUser);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, loginUser);

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticate, getUserProfile);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticate, validateProfileUpdate, updateUserProfile);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authenticate, validatePasswordChange, changePassword);

module.exports = router;
