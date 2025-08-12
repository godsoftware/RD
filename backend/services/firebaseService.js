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
    
    this.init();
  }

  init() {
    try {
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

      // Firebase'i sadece gerekli config varsa initialize et
      if (firebaseConfig.project_id && firebaseConfig.private_key && firebaseConfig.client_email) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          storageBucket: `${firebaseConfig.project_id}.appspot.com`
        });

        this.db = getFirestore();
        this.auth = getAuth();
        this.storage = getStorage();
        this.bucket = this.storage.bucket();
        this.isInitialized = true;

        console.log('✅ Firebase initialized successfully');
      } else {
        console.log('⚠️  Firebase not configured - using MongoDB only');
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      this.isInitialized = false;
    }
  }

  // Authentication Methods
  async verifyIdToken(idToken) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Token validasyonu
      if (!idToken || typeof idToken !== 'string') {
        throw new Error('Invalid token: Token must be a non-empty string');
      }

      // Token boş mu kontrol et
      const trimmedToken = idToken.trim();
      if (trimmedToken === '') {
        throw new Error('Invalid token: Token cannot be empty');
      }

      // JWT format kontrolü (3 part: header.payload.signature)
      const tokenParts = trimmedToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format: Expected JWT format with 3 parts');
      }

      // Her part'ın base64url encoded olduğunu kontrol et
      for (let i = 0; i < tokenParts.length; i++) {
        if (!tokenParts[i] || tokenParts[i].length === 0) {
          throw new Error(`Invalid token format: Part ${i + 1} is empty`);
        }
      }

      // Firebase ile token'ı doğrula
      const decodedToken = await this.auth.verifyIdToken(trimmedToken);
      
      if (!decodedToken) {
        throw new Error('Token verification returned null');
      }

      // Token'ın temel alanlarını kontrol et
      if (!decodedToken.uid) {
        throw new Error('Invalid token: Missing user ID');
      }

      return decodedToken;
    } catch (error) {
      console.error('Firebase token verification error:', error);
      
      // Firebase-specific hata mesajlarını yakala
      if (error.code) {
        switch (error.code) {
          case 'auth/id-token-expired':
            throw new Error('Token has expired. Please login again.');
          case 'auth/id-token-revoked':
            throw new Error('Token has been revoked. Please login again.');
          case 'auth/argument-error':
            throw new Error('Invalid token format provided.');
          case 'auth/invalid-id-token':
            throw new Error('Invalid ID token provided.');
          default:
            throw new Error(`Firebase Auth Error: ${error.message}`);
        }
      }
      
      // Kendi hata mesajlarımız
      if (error.message.includes('Invalid token')) {
        throw error;
      }
      
      // Genel hata
      throw new Error('Invalid Firebase token');
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
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const docRef = await this.db.collection('predictions').add({
        ...predictionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Patient'ın son prediction'ını güncelle
      if (predictionData.patientId) {
        await this.db.collection('patients').doc(predictionData.patientId).update({
          lastPrediction: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { id: docRef.id, ...predictionData };
    } catch (error) {
      console.error('Firebase save prediction error:', error);
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
