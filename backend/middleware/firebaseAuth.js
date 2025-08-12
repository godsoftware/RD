const firebaseService = require('../services/firebaseService');

// Firebase Authentication Middleware
const firebaseAuth = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const idToken = authHeader.split(' ')[1];

    if (!firebaseService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Firebase service not available'
      });
    }

    // Firebase token'ı doğrula
    const decodedToken = await firebaseService.verifyIdToken(idToken);
    
    // Kullanıcı bilgilerini Firestore'dan al
    const userDoc = await firebaseService.db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();

    // Kullanıcı aktif mi kontrol et
    if (userData.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Request'e kullanıcı bilgilerini ekle
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: userData.username,
      role: userData.role || 'user',
      isActive: userData.isActive
    };

    next();

  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    
    let message = 'Authentication failed';
    let statusCode = 401;
    
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expired, please login again';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid token';
    } else if (error.code === 'auth/argument-error') {
      message = 'Invalid token format';
    } else if (error.message?.includes('Firebase')) {
      statusCode = 503;
      message = 'Authentication service temporarily unavailable';
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional Authentication Middleware (kullanıcı giriş yapmış olabilir ya da olmayabilir)
const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Token yoksa req.user'ı null bırak ve devam et
      req.user = null;
      return next();
    }

    // Token varsa normal auth middleware'i çalıştır
    return firebaseAuth(req, res, next);

  } catch (error) {
    // Hata olursa req.user'ı null bırak ve devam et
    req.user = null;
    next();
  }
};

// Role-based Access Control
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin Only Middleware
const adminOnly = requireRole(['admin']);

// Doctor or Admin Middleware  
const medicalStaffOnly = requireRole(['doctor', 'admin']);

module.exports = {
  firebaseAuth,
  optionalFirebaseAuth,
  requireRole,
  adminOnly,
  medicalStaffOnly
};
