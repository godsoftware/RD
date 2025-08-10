const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Demo users (in memory - normally this would be in a database)
const demoUsers = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@medical.com',
    password: '$2a$12$mEiIThVthoI/A1FbsQmYEO2v5MEeyjTRmpCihAkGe7CYJhuIm1/Ya', // hashed 'demo123'
    role: 'user',
    createdAt: new Date().toISOString(),
    predictionCount: 0
  },
  {
    id: 2,
    username: 'doctor',
    email: 'doctor@medical.com', 
    password: '$2a$12$mEiIThVthoI/A1FbsQmYEO2v5MEeyjTRmpCihAkGe7CYJhuIm1/Ya', // hashed 'demo123'
    role: 'admin',
    createdAt: new Date().toISOString(),
    predictionCount: 5
  }
];

// In-memory predictions storage
let predictions = [];
let predictionIdCounter = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_key_for_medical_app';

/**
 * Demo Authentication Functions
 */
const demoAuth = {
  // Find user by email
  findUserByEmail: (email) => {
    return demoUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Find user by ID
  findUserById: (id) => {
    return demoUsers.find(user => user.id === parseInt(id));
  },

  // Compare password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Generate JWT token
  generateToken: (userId) => {
    return jwt.sign(
      { userId }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  // Verify JWT token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  // Register new user (demo - adds to memory)
  registerUser: async (userData) => {
    const { username, email, password } = userData;
    
    // Check if user exists
    if (demoAuth.findUserByEmail(email)) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = {
      id: demoUsers.length + 1,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      predictionCount: 0
    };

    demoUsers.push(newUser);
    return newUser;
  },

  // Login user
  loginUser: async (email, password) => {
    const user = demoAuth.findUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await demoAuth.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login (demo)
    user.lastLogin = new Date().toISOString();
    
    return user;
  },

  // Get user profile
  getUserProfile: (userId) => {
    const user = demoAuth.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Return user without password
    const { password, ...userProfile } = user;
    return userProfile;
  },

  // Create prediction
  createPrediction: (userId, predictionData) => {
    const user = demoAuth.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const prediction = {
      _id: predictionIdCounter++,
      user: userId,
      ...predictionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    predictions.push(prediction);
    user.predictionCount++;
    
    return prediction;
  },

  // Get user predictions
  getUserPredictions: (userId, page = 1, limit = 10) => {
    const userPredictions = predictions
      .filter(p => p.user === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPredictions = userPredictions.slice(startIndex, endIndex);
    
    return {
      predictions: paginatedPredictions.map(p => ({
        ...p,
        user: demoAuth.findUserById(p.user)
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(userPredictions.length / limit),
        totalPredictions: userPredictions.length,
        hasNextPage: endIndex < userPredictions.length,
        hasPrevPage: page > 1
      }
    };
  },

  // Get prediction statistics
  getPredictionStats: (userId) => {
    const userPredictions = predictions.filter(p => p.user === userId);
    const completedPredictions = userPredictions.filter(p => p.status === 'completed');
    const failedPredictions = userPredictions.filter(p => p.status === 'failed');
    
    const avgConfidence = completedPredictions.length > 0
      ? completedPredictions.reduce((sum, p) => sum + (p.result?.confidence || 0), 0) / completedPredictions.length
      : 0;

    const avgProcessingTime = completedPredictions.length > 0
      ? completedPredictions.reduce((sum, p) => sum + (p.processingTime || 0), 0) / completedPredictions.length
      : 0;

    return {
      totalPredictions: userPredictions.length,
      completedPredictions: completedPredictions.length,
      failedPredictions: failedPredictions.length,
      successRate: userPredictions.length > 0 
        ? ((completedPredictions.length / userPredictions.length) * 100).toFixed(2)
        : 0,
      avgConfidence: (avgConfidence * 100).toFixed(2),
      avgProcessingTime: avgProcessingTime.toFixed(2),
      recentPredictions: userPredictions.filter(p => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(p.createdAt) >= sevenDaysAgo;
      }).length
    };
  },

  // Delete prediction
  deletePrediction: (predictionId, userId) => {
    const index = predictions.findIndex(p => p._id === parseInt(predictionId) && p.user === userId);
    
    if (index === -1) {
      throw new Error('Prediction not found');
    }

    predictions.splice(index, 1);
    
    const user = demoAuth.findUserById(userId);
    if (user && user.predictionCount > 0) {
      user.predictionCount--;
    }
    
    return true;
  }
};

module.exports = demoAuth;
