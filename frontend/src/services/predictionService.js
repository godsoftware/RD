import axios from 'axios';

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for predictions (they might take longer)
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
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        localStorage.removeItem('token');
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

// Prediction service object
export const predictionService = {
  // Make a new prediction with auto model detection
  async makePrediction(inputData, file = null, modelType = null) {
    try {
      let requestData;
      let headers = {};

      if (file) {
        // If file is provided, use FormData for medical image analysis
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size);
        
        // Add model type if specified
        if (modelType) {
          formData.append('modelType', modelType);
        }
        
        // Add any additional input data
        if (inputData && typeof inputData === 'object') {
          Object.keys(inputData).forEach(key => {
            formData.append(key, inputData[key]);
          });
        }
        
        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Regular JSON request (fallback)
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

  // Specific model predictions for medical imaging
  async predictPneumonia(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'pneumonia');
  },

  async predictBrainTumor(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'brainTumor');
  },

  // predictAlzheimer removed

  async predictTuberculosis(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, 'tuberculosis');
  },

  // Auto-detect and predict
  async predictWithAutoDetection(file, additionalData = {}) {
    return this.makePrediction(additionalData, file, null);
  },

  // Get prediction history with pagination
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

  // Get single prediction by ID
  async getPredictionById(predictionId) {
    try {
      const response = await apiClient.get(`/prediction/${predictionId}`);

      if (response.success && response.data) {
        return response.data.prediction;
      }

      throw new Error(response.message || 'Failed to get prediction');
    } catch (error) {
      throw error;
    }
  },

  // Get prediction statistics
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

  // Delete a prediction
  async deletePrediction(predictionId) {
    try {
      const response = await apiClient.delete(`/prediction/${predictionId}`);

      if (response.success) {
        return response.message || 'Prediction deleted successfully';
      }

      throw new Error(response.message || 'Failed to delete prediction');
    } catch (error) {
      throw error;
    }
  },

  // Get model information
  async getModelInfo() {
    try {
      const response = await apiClient.get('/prediction/model-info');

      if (response.success && response.data) {
        return response.data.modelInfo;
      }

      throw new Error(response.message || 'Failed to get model information');
    } catch (error) {
      throw error;
    }
  },

  // Validate input data before sending
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
      
      // Check if all elements are numbers (for numeric predictions)
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

  // Format prediction result for display
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

  // Get prediction status color for UI
  getStatusColor(status) {
    const statusColors = {
      pending: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444'
    };
    
    return statusColors[status] || '#6b7280';
  },

  // Get confidence level description
  getConfidenceLevel(confidence) {
    const confidenceValue = typeof confidence === 'string' 
      ? parseFloat(confidence) 
      : confidence * 100;

    if (confidenceValue >= 90) return 'Very High';
    if (confidenceValue >= 75) return 'High';
    if (confidenceValue >= 60) return 'Medium';
    if (confidenceValue >= 40) return 'Low';
    return 'Very Low';
  }
};

export default predictionService;
