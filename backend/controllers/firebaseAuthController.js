const firebaseService = require('../services/firebaseService');
const { validationResult } = require('express-validator');

// @desc    Register new user with Firebase
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('📝 Firebase Register - Backend processing...');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    console.log('👤 Processing Firebase user and profile...');

    let userRecord;
    let userExists = false;

    try {
      // First, try to get the user by email if they already exist
      userRecord = await firebaseService.auth.getUserByEmail(email);
      userExists = true;
      console.log('✅ Firebase user already exists:', userRecord.email);
    } catch (getUserError) {
      // User doesn't exist, so create them
      if (getUserError.code === 'auth/user-not-found') {
        console.log('👤 Creating new Firebase user...');
        try {
          userRecord = await firebaseService.createUser({
            username,
            email,
            password,
            role: role || 'user'
          });
          console.log('✅ Firebase user created:', userRecord.email);
        } catch (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }
      } else {
        // Some other error occurred
        throw getUserError;
      }
    }

    // If user already exists, just create/update their Firestore profile
    if (userExists) {
      console.log('📝 Creating/updating Firestore profile for existing user...');
      
      // Check if Firestore profile exists
      const userDoc = await firebaseService.db.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        // Create Firestore profile
        await firebaseService.db.collection('users').doc(userRecord.uid).set({
          email: email,
          username: username,
          role: role || 'user',
          createdAt: firebaseService.admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        });
        console.log('✅ Firestore profile created for existing user');
      } else {
        // Update username if needed
        await firebaseService.db.collection('users').doc(userRecord.uid).update({
          username: username,
          updatedAt: firebaseService.admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Firestore profile updated for existing user');
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          username: username,
          role: role || 'user'
        }
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    let message = 'Registration failed';
    if (error.code === 'auth/email-already-exists') {
      message = 'Email already exists';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    }

    res.status(400).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user with Firebase
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('🔐 Firebase Login - Backend validation starting...');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    console.log('🎫 Verifying Firebase ID token...');

    // Firebase token'ı doğrula
    const decodedToken = await firebaseService.verifyIdToken(idToken);
    
    console.log('✅ Firebase token verified for:', decodedToken.email);
    
    // Kullanıcı bilgilerini Firestore'dan al veya oluştur
    let userDoc = await firebaseService.db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      console.log('👤 Creating user profile in Firestore...');
      // Eğer kullanıcı profili yoksa oluştur
      await firebaseService.db.collection('users').doc(decodedToken.uid).set({
        email: decodedToken.email,
        username: decodedToken.name || decodedToken.email.split('@')[0],
        role: 'user',
        createdAt: firebaseService.admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });
      
      userDoc = await firebaseService.db.collection('users').doc(decodedToken.uid).get();
    }

    const userData = userDoc.data();

    console.log('✅ User profile retrieved:', userData.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          username: userData.username,
          role: userData.role || 'user'
        },
        token: idToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    let message = 'Login failed';
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expired, please login again';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid token';
    }

    res.status(401).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    
    const userDoc = await firebaseService.db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        user: {
          uid: uid,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          createdAt: userData.createdAt,
          isActive: userData.isActive
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const uid = req.user.uid;
    const { username, email } = req.body;

    // Firestore'da güncelle
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    updateData.updatedAt = new Date();

    await firebaseService.db.collection('users').doc(uid).update(updateData);

    // Firebase Auth'da da email güncellenebilir
    if (email) {
      await firebaseService.updateUser(uid, { email });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          uid: uid,
          ...updateData
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Firebase'den kullanıcıyı sil (Auth + Firestore)
    await firebaseService.deleteUser(uid);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
