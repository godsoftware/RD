const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Import models (will use demoAuth in demo mode)
const User = require('../models/User');
const demoAuth = require('../demoAuth');

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';

// Token generation function
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role = 'user' } = req.body;

    let user, userResponse;

    if (isDemoMode) {
      // Use demo auth to register user
      user = await demoAuth.registerUser(username, email, password, role);
      userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        predictionCount: user.predictionCount
      };
    } else {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      user = new User({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        predictionCount: 0
      });

      await user.save();

      userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        predictionCount: user.predictionCount
      };
    }

    // Generate token
    const token = generateToken(userResponse.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'User registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    let user, userResponse;

    if (isDemoMode) {
      // Use demo auth to login user
      user = await demoAuth.loginUser(email, password);
      userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        predictionCount: user.predictionCount
      };
    } else {
      // Find user by email
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        predictionCount: user.predictionCount
      };
    }

    // Generate token
    const token = generateToken(userResponse.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    let user;

    if (isDemoMode) {
      user = demoAuth.getUserProfile(req.user.userId);
    } else {
      user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      // Format user response
      user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        predictionCount: user.predictionCount
      };
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email } = req.body;
    const userId = req.user.userId;

    let updatedUser;

    if (isDemoMode) {
      // Use demo auth for profile update
      updatedUser = demoAuth.updateUserProfile(userId, { username, email });
    } else {
      // Check if email/username is already taken by another user
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          { email: email.toLowerCase() },
          { username }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already taken by another user'
        });
      }

      // Update user
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          username,
          email: email.toLowerCase()
        },
        { new: true, runValidators: true }
      ).select('-password');

      // Format response
      updatedUser = {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        predictionCount: updatedUser.predictionCount
      };
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword
};
