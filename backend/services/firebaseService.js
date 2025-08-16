// Firebase Integration Service
// Bu dosya Firebase Authentication ve Firestore için optional servis sağlar

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.bucket = null;
    this.admin = admin; // Expose admin for external use
    
    this.init();
  }

  init() {
    try {
      console.log('🔥 Firebase initialization starting...');
      
      // Debug environment variables
      console.log('🔍 Environment variables check:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
      console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
      console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
      
      // Firebase config'i environment variables'dan al
      const firebaseConfig = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      console.log('🔧 Firebase config prepared');

      // Firebase'i sadece gerekli config varsa initialize et
      if (firebaseConfig.project_id && firebaseConfig.private_key && firebaseConfig.client_email) {
        console.log('✅ Required Firebase configs found, initializing...');
        
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          storageBucket: `${firebaseConfig.project_id}.firebasestorage.app`
        });

        this.db = getFirestore();
        this.auth = getAuth();
        this.storage = getStorage();
        this.bucket = this.storage.bucket();
        
        // ÖNEMLİ: undefined değerleri otomatik ignore et
        this.db.settings({
          ignoreUndefinedProperties: true
        });
        
        this.isInitialized = true;

        console.log('✅ Firebase initialized successfully');
        console.log('📊 Project ID:', firebaseConfig.project_id);
      } else {
        console.log('⚠️  Missing Firebase configuration:');
        console.log('  - project_id:', firebaseConfig.project_id ? '✅' : '❌');
        console.log('  - private_key:', firebaseConfig.private_key ? '✅' : '❌');
        console.log('  - client_email:', firebaseConfig.client_email ? '✅' : '❌');
        console.log('🚫 Firebase not configured - will use mock data');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      console.error('📋 Full error:', error);
      this.isInitialized = false;
    }
  }

  // Authentication Methods
  async verifyIdToken(idToken) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase token verification error:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  async createUser(userData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName || userData.username,
        disabled: false
      });

      // Firestore'da kullanıcı profili oluştur
      await this.db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        username: userData.username,
        role: userData.role || 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });

      return userRecord;
    } catch (error) {
      console.error('Firebase create user error:', error);
      throw error;
    }
  }

  async updateUser(uid, updateData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await this.auth.updateUser(uid, updateData);
      
      // Firestore'da da güncelle
      await this.db.collection('users').doc(uid).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Firebase update user error:', error);
      throw error;
    }
  }

  async deleteUser(uid) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await this.auth.deleteUser(uid);
      await this.db.collection('users').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('Firebase delete user error:', error);
      throw error;
    }
  }

  // Firestore Database Methods
  async savePatient(patientData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await this.db.collection('patients').add({
        ...patientData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { id: docRef.id, ...patientData };
    } catch (error) {
      console.error('Firebase save patient error:', error);
      throw error;
    }
  }

  async getPatients(options = {}) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      let query = this.db.collection('patients');

      // Filtering
      if (options.isActive !== undefined) {
        query = query.where('isActive', '==', options.isActive);
      }

      // Sorting
      if (options.sortBy) {
        const direction = options.sortOrder === 'asc' ? 'asc' : 'desc';
        query = query.orderBy(options.sortBy, direction);
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      const snapshot = await query.get();
      const patients = [];

      snapshot.forEach(doc => {
        patients.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return patients;
    } catch (error) {
      console.error('Firebase get patients error:', error);
      throw error;
    }
  }

  async getPatientsByUserId(userId) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const snapshot = await this.db.collection('patients')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const patients = [];
      snapshot.forEach(doc => {
        patients.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return patients;
    } catch (error) {
      console.error('Firebase get patients by user error:', error);
      throw error;
    }
  }

  async createPatient(patientData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await this.db.collection('patients').add({
        ...patientData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Firebase create patient error:', error);
      throw error;
    }
  }

  async updatePatient(patientId, updateData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await this.db.collection('patients').doc(patientId).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Firebase update patient error:', error);
      throw error;
    }
  }

  async deletePatient(patientId) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await this.db.collection('patients').doc(patientId).delete();
    } catch (error) {
      console.error('Firebase delete patient error:', error);
      throw error;
    }
  }

  async getPredictionsByPatientId(patientId) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const snapshot = await this.db.collection('predictions')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const predictions = [];
      snapshot.forEach(doc => {
        predictions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return predictions;
    } catch (error) {
      console.error('Firebase get predictions by patient error:', error);
      throw error;
    }
  }

  async getPatientById(patientId) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const doc = await this.db.collection('patients').doc(patientId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Firebase get patient error:', error);
      throw error;
    }
  }

  async savePrediction(predictionData) {
    console.log('🔥 savePrediction called in Firebase service');
    console.log('🔧 Service initialized:', this.isInitialized);
    console.log('📊 Database available:', !!this.db);
    
    if (!this.isInitialized) {
      console.error('❌ Firebase not initialized in savePrediction');
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('💾 Adding document to predictions collection...');
      console.log('📋 Collection path: predictions');
      
      // Final sanitization - remove any remaining undefined values
      const finalData = JSON.parse(JSON.stringify(predictionData, (key, value) => {
        return value === undefined ? null : value;
      }));
      
      console.log('📄 Final document data to add:', JSON.stringify(finalData, null, 2));
      
      const docRef = await this.db.collection('predictions').add({
        ...finalData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Document added successfully!');
      console.log('🆔 Generated document ID:', docRef.id);
      console.log('📊 Collection path used:', docRef.parent.path);

      // Patient'ın son prediction'ını güncelle
      if (finalData.patientId) {
        console.log('👥 Updating patient record:', finalData.patientId);
        await this.db.collection('patients').doc(finalData.patientId).update({
          lastPrediction: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Patient record updated');
      }

      const result = { id: docRef.id, ...finalData };
      console.log('📤 Returning result:', {
        id: result.id,
        userId: result.userId,
        hasPatientInfo: !!result.patientInfo
      });
      
      return result;
    } catch (error) {
      console.error('❌ Firebase save prediction error:', error);
      console.error('📋 Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  async getPredictionHistory(patientId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      let query = this.db.collection('predictions')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc');

      if (options.modelType) {
        query = query.where('modelType', '==', options.modelType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      const predictions = [];

      snapshot.forEach(doc => {
        predictions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return predictions;
    } catch (error) {
      console.error('Firebase get prediction history error:', error);
      throw error;
    }
  }

  // File Storage Methods
  async uploadMedicalImage(imageBuffer, fileName, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const file = this.bucket.file(`medical-images/${Date.now()}-${fileName}`);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: metadata.contentType || 'image/jpeg',
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalName: fileName,
            ...metadata
          }
        }
      });

      // Public URL al
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${file.name}`;

      return {
        fileName: file.name,
        publicUrl,
        size: imageBuffer.length
      };
    } catch (error) {
      console.error('Firebase upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      await this.bucket.file(fileName).delete();
      return true;
    } catch (error) {
      console.error('Firebase delete file error:', error);
      throw error;
    }
  }

  // Real-time Methods
  listenToPatientUpdates(patientId, callback) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    const unsubscribe = this.db.collection('patients').doc(patientId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback({
            id: doc.id,
            ...doc.data()
          });
        }
      }, (error) => {
        console.error('Firebase listen error:', error);
        callback(null, error);
      });

    return unsubscribe;
  }

  listenToPredictions(patientId, callback) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    const unsubscribe = this.db.collection('predictions')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .onSnapshot((snapshot) => {
        const predictions = [];
        snapshot.forEach(doc => {
          predictions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(predictions);
      }, (error) => {
        console.error('Firebase predictions listen error:', error);
        callback(null, error);
      });

    return unsubscribe;
  }

  // Analytics Methods
  async getAnalytics(dateRange = {}) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      let query = this.db.collection('predictions');

      if (dateRange.startDate) {
        query = query.where('createdAt', '>=', dateRange.startDate);
      }

      if (dateRange.endDate) {
        query = query.where('createdAt', '<=', dateRange.endDate);
      }

      const snapshot = await query.get();
      const predictions = [];

      snapshot.forEach(doc => {
        predictions.push(doc.data());
      });

      // Analytics hesapla
      const analytics = {
        totalPredictions: predictions.length,
        modelTypeDistribution: {},
        averageConfidence: 0,
        positiveResults: 0,
        dailyStats: {}
      };

      predictions.forEach(pred => {
        // Model type distribution
        analytics.modelTypeDistribution[pred.modelType] = 
          (analytics.modelTypeDistribution[pred.modelType] || 0) + 1;

        // Average confidence
        analytics.averageConfidence += pred.confidence || 0;

        // Positive results
        if (pred.isPositive) {
          analytics.positiveResults++;
        }

        // Daily stats
        const date = pred.createdAt.toDate().toDateString();
        analytics.dailyStats[date] = (analytics.dailyStats[date] || 0) + 1;
      });

      if (predictions.length > 0) {
        analytics.averageConfidence = Math.round(analytics.averageConfidence / predictions.length);
      }

      return analytics;
    } catch (error) {
      console.error('Firebase analytics error:', error);
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    if (!this.isInitialized) {
      return { status: 'disabled', message: 'Firebase not configured' };
    }

    try {
      // Simple Firestore read test
      await this.db.collection('health').limit(1).get();
      return { status: 'healthy', message: 'Firebase connection OK' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// Singleton instance
const firebaseService = new FirebaseService();

module.exports = firebaseService;
