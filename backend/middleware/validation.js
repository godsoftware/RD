const { body, query, param } = require('express-validator');

// User registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// User login validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return value;
    })
];

// Prediction input validation
const validatePrediction = [
  body('inputData')
    .notEmpty()
    .withMessage('Input data is required')
    .custom((value) => {
      // Basic validation - adjust based on your specific requirements
      if (typeof value !== 'object') {
        throw new Error('Input data must be an object or array');
      }
      
      if (Array.isArray(value) && value.length === 0) {
        throw new Error('Input data array cannot be empty');
      }
      
      if (!Array.isArray(value) && Object.keys(value).length === 0) {
        throw new Error('Input data object cannot be empty');
      }
      
      return true;
    }),
    
  body('fileName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('File name cannot exceed 255 characters'),
    
  body('fileSize')
    .optional()
    .isNumeric()
    .withMessage('File size must be a number')
    .custom((value) => {
      if (value > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size cannot exceed 10MB');
      }
      return true;
    })
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('Status must be one of: pending, completed, failed')
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`)
];

// File upload validation
const validateFileUpload = [
  body('file')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        // Check file size
        if (req.file.size > 10 * 1024 * 1024) {
          throw new Error('File size cannot exceed 10MB');
        }
        
        // Check file type (adjust based on your requirements)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/csv', 'application/json'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, CSV, JSON');
        }
      }
      
      return true;
    })
];

// Sanitization helpers
const sanitizeInput = (req, res, next) => {
  // Basic HTML sanitization for all string inputs
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove HTML tags and dangerous characters
        obj[key] = obj[key].replace(/<[^>]*>?/gm, '').trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePrediction,
  validatePagination,
  validateObjectId,
  validateFileUpload,
  sanitizeInput
};
