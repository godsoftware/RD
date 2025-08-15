import axios from 'axios';
import { enhancedAuthService } from './enhancedAuthService';

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for AI predictions
});

// Request interceptor to add Firebase ID token
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🔐 Request interceptor called');
    try {
      const token = await enhancedAuthService.getCurrentToken();
      console.log('🔑 Token retrieved:', token ? 'YES' : 'NO');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set');
      } else {
        console.log('⚠️ No token available');
        // DEBUG: Geçici olarak auth bypass
        console.log('🚫 DEBUG: Bypassing auth for testing');
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      console.log('🚫 DEBUG: Bypassing auth due to error');
      delete config.headers.Authorization;
    }
    console.log('📤 Final request config:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('🔧 Axios Interceptor - Status:', response.status);
    console.log('🔧 Axios Interceptor - Headers:', response.headers);
    console.log('🔧 Axios Interceptor - Raw Response:', response);
    console.log('🔧 Axios Interceptor - Response Data:', response.data);
    console.log('🔧 Axios Interceptor - Data Type:', typeof response.data);
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        enhancedAuthService.logout();
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

// Enhanced Prediction Service
export const enhancedPredictionService = {
  // Make enhanced prediction with Gemini AI interpretation
  async makeEnhancedPrediction(file, patientInfo, modelType = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Patient information
      if (patientInfo.patientId) formData.append('patientId', patientInfo.patientId);
      if (patientInfo.patientName) formData.append('patientName', patientInfo.patientName);
      if (patientInfo.age) formData.append('age', patientInfo.age.toString());
      if (patientInfo.weight) formData.append('weight', patientInfo.weight.toString());
      if (patientInfo.gender) formData.append('gender', patientInfo.gender);
      if (patientInfo.symptoms) formData.append('symptoms', patientInfo.symptoms);
      if (patientInfo.medicalHistory) formData.append('medicalHistory', patientInfo.medicalHistory);
      
      // Model type
      if (modelType) formData.append('modelType', modelType);

      const response = await apiClient.post('/prediction/enhanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📡 Raw API Response:', response);
      console.log('📡 Response Status:', response?.success);
      console.log('📡 Response Data:', response?.data);
      console.log('📡 Full Response JSON:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ API Success - Returning Data:', response.data);
        return response.data;
      } else if (response.data) {
        console.log('⚠️ API Response without success flag - Returning Data:', response.data);
        return response.data;
      } else if (response.prediction) {
        console.log('⚠️ API Response with direct prediction - Returning Prediction:', response.prediction);
        return { prediction: response.prediction };
      }

      throw new Error(response.message || 'Enhanced prediction failed');
    } catch (error) {
      console.error('Enhanced prediction error:', error);
      throw error;
    }
  },

  // Specific enhanced model predictions
  async predictPneumoniaEnhanced(file, patientInfo) {
    return this.makeEnhancedPrediction(file, patientInfo, 'pneumonia');
  },

  async predictBrainTumorEnhanced(file, patientInfo) {
    return this.makeEnhancedPrediction(file, patientInfo, 'brainTumor');
  },

  async predictTuberculosisEnhanced(file, patientInfo) {
    return this.makeEnhancedPrediction(file, patientInfo, 'tuberculosis');
  },

  // Auto-detect enhanced prediction
  async predictWithAutoDetectionEnhanced(file, patientInfo) {
    return this.makeEnhancedPrediction(file, patientInfo, null);
  },

  // Get enhanced prediction history
  async getEnhancedPredictionHistory(page = 1, limit = 10, filters = {}) {
    try {
      const params = { page, limit };
      
      if (filters.patientId) params.patientId = filters.patientId;
      if (filters.modelType) params.modelType = filters.modelType;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await apiClient.get('/prediction/history', { params });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get enhanced prediction history');
    } catch (error) {
      console.error('Get enhanced prediction history error:', error);
      throw error;
    }
  },

  // Get single enhanced prediction by ID
  async getEnhancedPredictionById(predictionId) {
    try {
      const response = await apiClient.get(`/prediction/${predictionId}`);

      if (response.success && response.data) {
        return response.data.prediction;
      }

      throw new Error(response.message || 'Failed to get enhanced prediction');
    } catch (error) {
      console.error('Get enhanced prediction error:', error);
      throw error;
    }
  },

  // Get enhanced prediction statistics
  async getEnhancedPredictionStats() {
    try {
      const response = await apiClient.get('/prediction/stats');

      if (response.success && response.data) {
        return response.data.stats;
      }

      throw new Error(response.message || 'Failed to get enhanced prediction statistics');
    } catch (error) {
      console.error('Get enhanced prediction stats error:', error);
      throw error;
    }
  },

  // Delete enhanced prediction
  async deleteEnhancedPrediction(predictionId) {
    try {
      const response = await apiClient.delete(`/prediction/${predictionId}`);

      if (response.success) {
        return response.message || 'Enhanced prediction deleted successfully';
      }

      throw new Error(response.message || 'Failed to delete enhanced prediction');
    } catch (error) {
      console.error('Delete enhanced prediction error:', error);
      throw error;
    }
  },

  // Get personalized health recommendations using Gemini AI
  async getHealthRecommendations(patientData) {
    try {
      const response = await apiClient.post('/prediction/recommendations', {
        patientData: patientData
      });

      if (response.success && response.data) {
        return response.data.recommendations;
      }

      throw new Error(response.message || 'Failed to get health recommendations');
    } catch (error) {
      console.error('Get health recommendations error:', error);
      throw error;
    }
  },

  // Legacy prediction methods (backward compatibility)
  async makePrediction(inputData, file = null, modelType = null) {
    try {
      let requestData;
      let headers = {};

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size);
        
        if (modelType) {
          formData.append('modelType', modelType);
        }
        
        if (inputData && typeof inputData === 'object') {
          Object.keys(inputData).forEach(key => {
            formData.append(key, inputData[key]);
          });
        }
        
        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        requestData = { 
          inputData,
          modelType 
        };
      }

      const response = await apiClient.post('/prediction/predict', requestData, {
        headers
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Prediction failed');
    } catch (error) {
      throw error;
    }
  },

  // Legacy methods
  async predictPneumonia(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'pneumonia');
  },

  async predictBrainTumor(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'brainTumor');
  },

  async predictTuberculosis(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'tuberculosis');
  },

  async predictWithAutoDetection(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, null);
  },

  async getPredictionHistory(page = 1, limit = 10, status = null) {
    try {
      const params = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await apiClient.get('/prediction/history', { params });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get prediction history');
    } catch (error) {
      throw error;
    }
  },

  async getPredictionStats() {
    try {
      const response = await apiClient.get('/prediction/stats');

      if (response.success && response.data) {
        return response.data.stats;
      }

      throw new Error(response.message || 'Failed to get prediction statistics');
    } catch (error) {
      throw error;
    }
  },

  // Utility methods
  validateInputData(inputData) {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    if (typeof inputData !== 'object') {
      throw new Error('Input data must be an object or array');
    }

    if (Array.isArray(inputData)) {
      if (inputData.length === 0) {
        throw new Error('Input data array cannot be empty');
      }
      
      const hasInvalidData = inputData.some(item => 
        typeof item !== 'number' && typeof item !== 'string'
      );
      
      if (hasInvalidData) {
        throw new Error('Input data array should contain only numbers or strings');
      }
    } else {
      if (Object.keys(inputData).length === 0) {
        throw new Error('Input data object cannot be empty');
      }
    }

    return true;
  },

  formatPredictionResult(result) {
    return {
      ...result,
      confidence: typeof result.confidence === 'number' 
        ? (result.confidence * 100).toFixed(2) + '%'
        : result.confidence,
      processingTime: typeof result.processingTime === 'number'
        ? result.processingTime + 'ms'
        : result.processingTime
    };
  },

  getStatusColor(status) {
    const statusColors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444'
    };
    
    return statusColors[status] || '#6b7280';
  },

  getConfidenceLevel(confidence) {
    const confidenceValue = typeof confidence === 'string' 
      ? parseFloat(confidence) 
      : confidence * 100;

    if (confidenceValue >= 90) return 'Very High';
    if (confidenceValue >= 75) return 'High';
    if (confidenceValue >= 60) return 'Medium';
    if (confidenceValue >= 40) return 'Low';
    return 'Very Low';
  },

  // Format medical interpretation for display
  formatMedicalInterpretation(interpretation) {
    if (!interpretation) return null;

    // Split interpretation into sections
    const sections = interpretation.split('\n\n').filter(section => section.trim());
    
    return sections.map(section => {
      const lines = section.split('\n');
      const title = lines[0].replace(/^\*\*|\*\*$/g, '').replace(/^[0-9]+\.\s*/, '');
      const content = lines.slice(1).join('\n');
      
      return {
        title: title,
        content: content
      };
    });
  }
};

export default enhancedPredictionService;
