const jwt = require('jsonwebtoken');
const User = require('../models/User');
const demoAuth = require('../demoAuth');

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';

// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    try {
      let decoded, user;
      
      if (isDemoMode) {
        // Verify token using demo auth
        decoded = demoAuth.verifyToken(token);
        
        if (!decoded) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token.'
          });
        }
        
        // Check if user still exists
        user = demoAuth.findUserById(decoded.userId);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists.'
          });
        }

        // Add user to request object
        req.user = {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      } else {
        // Verify token with JWT
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists.'
          });
        }

        // Add user to request object
        req.user = {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = demoAuth.verifyToken(token);
      const user = demoAuth.findUserById(decoded?.userId);
      
      if (user) {
        req.user = {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    } catch (jwtError) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
