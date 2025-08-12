import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import axios from 'axios';

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add Firebase ID token
apiClient.interceptors.request.use(
  async (config) => {
    if (auth?.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Token expired or invalid
        signOut(auth);
        window.location.href = '/login';
      }
      
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        errors: data?.errors || []
      });
    } else if (error.request) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0
      });
    } else {
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0
      });
    }
  }
);

// Enhanced Auth Service
export const enhancedAuthService = {
  // Register new user with Firebase + Backend
  async register(userData) {
    try {
      const { username, email, password, role } = userData;
      
      // Firebase'de kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Display name'i güncelle
      await updateProfile(user, {
        displayName: username
      });
      
      // Backend'e kullanıcı bilgilerini kaydet
      const response = await apiClient.post('/auth/register', {
        username,
        email,
        password, // Backend'de sadece kayıt için, saklanmayacak
        role: role || 'user'
      });
      
      return {
        user: {
          uid: user.uid,
          email: user.email,
          username: username,
          role: role || 'user'
        },
        message: response.message
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user with Firebase
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ID token'ı al
      const idToken = await user.getIdToken();
      
      // Backend'e token gönder
      const response = await apiClient.post('/auth/login', {
        idToken: idToken
      });
      
      return {
        user: response.data.user,
        token: idToken,
        message: response.message
      };
      
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        message = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      
      throw { message, code: error.code };
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      
      // Firebase'de de display name'i güncelle
      if (userData.username && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: userData.username
        });
      }
      
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let message = 'Password reset failed';
      if (error.code === 'auth/user-not-found') {
        message = 'User not found';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      
      throw { message, code: error.code };
    }
  },

  // Delete user account
  async deleteAccount() {
    try {
      const response = await apiClient.delete('/auth/account');
      
      // Firebase'den de kullanıcıyı sil
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth?.currentUser;
  },

  // Get current Firebase user
  getCurrentUser() {
    return auth?.currentUser;
  },

  // Get current ID token
  async getCurrentToken() {
    if (auth?.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (error) {
        console.error('Error getting current token:', error);
        return null;
      }
    }
    return null;
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {}; // Return empty unsubscribe function if auth is not initialized
  },

  // Check Firebase configuration
  isFirebaseConfigured() {
    return !!(auth && process.env.REACT_APP_FIREBASE_API_KEY);
  }
};

export default enhancedAuthService;
