import axios from 'axios';

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Return formatted error
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        errors: data?.errors || []
      });
    } else if (error.request) {
      // Network error
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0
      });
    } else {
      // Other error
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0
      });
    }
  }
);

// Auth service object
export const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        return { user, token };
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        return { user, token };
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout() {
    localStorage.removeItem('token');
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to get profile');
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      throw error;
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiClient.put('/auth/change-password', passwordData);
      
      if (response.success) {
        return response.message || 'Password changed successfully';
      }
      
      throw new Error(response.message || 'Failed to change password');
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Basic JWT token validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get current token
  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;
