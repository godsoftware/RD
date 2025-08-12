const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount
} = require('../controllers/firebaseAuthController');

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'doctor', 'admin'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Firebase ID token is required')
];

const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

// @desc    Register new user with Firebase
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, register);

// @desc    Login user with Firebase
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, login);

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', firebaseAuth, getProfile);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', firebaseAuth, updateProfileValidation, updateProfile);

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
router.delete('/account', firebaseAuth, deleteAccount);

module.exports = router;
