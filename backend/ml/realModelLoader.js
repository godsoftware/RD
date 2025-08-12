/**
 * Real TensorFlow.js Model Loader for Medical Image Analysis
 * 
 * Supports 3 AI Models:
 * 1. Pneumonia Detection (X-ray)
 * 2. Brain Tumor Detection (CT/MRI) 
 * 3. Alzheimer Detection (MRI)
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const path = require('path');
const fs = require('fs');

class RealModelLoader {
  constructor() {
    // Model instances
    this.models = {
      pneumonia: null,
      brainTumor: null, 
      alzheimer: null,
      tuberculosis: null
    };
    
    // Loading states
    this.loadingStates = {
      pneumonia: false,
      brainTumor: false,
      alzheimer: false,
      tuberculosis: false
    };
    
    // Model paths from environment or auto-resolved from common filenames
    this.modelPaths = {
      pneumonia: process.env.PNEUMONIA_MODEL_PATH || this.resolveModelPath([
        './ml/models/pneumonia_detection.h5',
        './ml/models/best_pneumonia_model.h5'
      ]),
      brainTumor: process.env.BRAIN_TUMOR_MODEL_PATH || this.resolveModelPath([
        './ml/models/brain_tumor_detection.h5',
        './ml/models/best_brain_tumor_model.h5'
      ]), 
      alzheimer: process.env.ALZHEIMER_MODEL_PATH || this.resolveModelPath([
        './ml/models/alzheimer_detection.h5',
        './ml/models/best_alzheimer_model.h5'
      ]),
      tuberculosis: process.env.TUBERCULOSIS_MODEL_PATH || this.resolveModelPath([
        './ml/models/tuberculosis_detection.h5',
        './ml/models/best_tb_model.h5',
        './ml/models/tb_detection.h5'
      ])
    };
    
    // Model configurations
    this.modelConfigs = {
      pneumonia: {
        inputShape: [224, 224, 3], // RGB image 224x224
        classes: ['Normal', 'Pneumonia'],
        threshold: 0.5
      },
      brainTumor: {
        inputShape: [224, 224, 3], // RGB image 224x224  
        classes: ['No Tumor', 'Glioma', 'Meningioma', 'Pituitary'],
        threshold: 0.25 // Multi-class, lower threshold
      },
      alzheimer: {
        inputShape: [224, 224, 3], // RGB image 224x224
        classes: ['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented'], 
        threshold: 0.25 // Multi-class, lower threshold
      },
      tuberculosis: {
        inputShape: [224, 224, 3], // RGB image 224x224
        classes: ['Normal', 'Tuberculosis'],
        threshold: 0.5
      }
    };

    console.log('🤖 Real AI Model Loader initialized');
  }

  /**
   * Resolve first existing path from candidate list
   * @param {string[]} candidatePaths
   * @returns {string|null}
   */
  resolveModelPath(candidatePaths) {
    for (const candidate of candidatePaths) {
      const absolute = path.resolve(candidate);
      if (fs.existsSync(absolute)) {
        return candidate;
      }
    }
    // Return the first candidate to keep a stable default; existence is checked later
    return candidatePaths[0];
  }

  /**
   * Load specific model
   * @param {string} modelType - pneumonia, brainTumor, or alzheimer
   */
  async loadModel(modelType) {
    if (!this.modelConfigs[modelType]) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    if (this.models[modelType]) {
      console.log(`✅ Model ${modelType} already loaded`);
      return this.models[modelType];
    }

    if (this.loadingStates[modelType]) {
      console.log(`⏳ Model ${modelType} already loading, waiting...`);
      // Wait for loading to complete
      while (this.loadingStates[modelType]) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.models[modelType];
    }

    try {
      this.loadingStates[modelType] = true;
      console.log(`🚀 Loading ${modelType} model...`);

      const modelPath = this.modelPaths[modelType];
      
      // Check if model file exists
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model file not found: ${modelPath}`);
      }

      console.log(`📂 Loading model from: ${modelPath}`);

      // Load model based on file extension
      let model;
      if (modelPath.endsWith('.h5')) {
        // Load H5 model (Keras format)
        model = await tf.loadLayersModel(`file://${path.resolve(modelPath)}`);
      } else if (modelPath.endsWith('.json')) {
        // Load TensorFlow.js JSON model
        model = await tf.loadLayersModel(`file://${path.resolve(modelPath)}`);
      } else {
        // Load SavedModel format
        model = await tf.loadGraphModel(`file://${path.resolve(modelPath)}`);
      }

      this.models[modelType] = model;
      this.loadingStates[modelType] = false;

      console.log(`✅ Model ${modelType} loaded successfully`);
      console.log(`📊 Input shape: [${this.modelConfigs[modelType].inputShape.join(', ')}]`);
      console.log(`🏷️  Classes: ${this.modelConfigs[modelType].classes.join(', ')}`);

      return model;

    } catch (error) {
      this.loadingStates[modelType] = false;
      console.error(`❌ Failed to load ${modelType} model:`, error.message);
      throw new Error(`Failed to load ${modelType} model: ${error.message}`);
    }
  }

  /**
   * Load all models
   */
  async loadAllModels() {
    console.log('🚀 Loading all medical AI models...');
    
    const loadPromises = Object.keys(this.modelConfigs).map(modelType => 
      this.loadModel(modelType).catch(error => {
        console.error(`⚠️  Failed to load ${modelType}:`, error.message);
        return null; // Continue loading other models
      })
    );

    await Promise.all(loadPromises);
    
    const loadedModels = Object.keys(this.models).filter(key => this.models[key] !== null);
    console.log(`✅ Loaded ${loadedModels.length}/3 models: ${loadedModels.join(', ')}`);
  }

  /**
   * Preprocess image for model input
   * @param {tf.Tensor} imageTensor - Input image tensor
   * @param {string} modelType - Model type for specific preprocessing
   */
  preprocessImage(imageTensor, modelType) {
    const config = this.modelConfigs[modelType];
    
    // Resize image to model input shape
    let processed = tf.image.resizeBilinear(
      imageTensor, 
      [config.inputShape[0], config.inputShape[1]]
    );
    
    // Ensure 3 channels (RGB)
    if (processed.shape[2] === 1) {
      // Grayscale to RGB
      processed = tf.concat([processed, processed, processed], 2);
    } else if (processed.shape[2] === 4) {
      // RGBA to RGB (remove alpha channel)
      processed = processed.slice([0, 0, 0], [-1, -1, 3]);
    }
    
    // Normalize pixel values to [0, 1]
    processed = processed.div(255.0);
    
    // Add batch dimension
    processed = processed.expandDims(0);
    
    return processed;
  }

  /**
   * Make prediction with specific model
   * @param {Buffer|tf.Tensor} imageInput - Image data or tensor
   * @param {string} modelType - pneumonia, brainTumor, or alzheimer
   */
  async predict(imageInput, modelType) {
    // Validate model type
    if (!this.modelConfigs[modelType]) {
      throw new Error(`Unknown model type: ${modelType}. Available: ${Object.keys(this.modelConfigs).join(', ')}`);
    }

    // Load model if not already loaded
    const model = await this.loadModel(modelType);
    
    if (!model) {
      throw new Error(`Model ${modelType} failed to load`);
    }

    let imageTensor;
    
    try {
      // Convert input to tensor if needed
      if (Buffer.isBuffer(imageInput)) {
        imageTensor = tf.node.decodeImage(imageInput);
      } else if (imageInput instanceof tf.Tensor) {
        imageTensor = imageInput;
      } else {
        throw new Error('Invalid image input. Expected Buffer or Tensor.');
      }

      // Preprocess image
      const processedImage = this.preprocessImage(imageTensor, modelType);
      
      // Make prediction
      console.log(`🔮 Making ${modelType} prediction...`);
      const prediction = model.predict(processedImage);
      
      // Get prediction data
      const predictionData = await prediction.data();
      const predictionArray = Array.from(predictionData);
      
      // Process results based on model type
      const config = this.modelConfigs[modelType];
      const results = this.processPredictionResults(predictionArray, config, modelType);
      
      // Clean up tensors
      if (Buffer.isBuffer(imageInput)) {
        imageTensor.dispose();
      }
      processedImage.dispose();
      prediction.dispose();
      
      return results;

    } catch (error) {
      // Clean up tensors on error
      if (imageTensor && Buffer.isBuffer(imageInput)) {
        imageTensor.dispose();
      }
      
      console.error(`❌ Prediction error for ${modelType}:`, error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Process raw prediction results
   * @param {Array} predictionArray - Raw prediction values
   * @param {Object} config - Model configuration
   * @param {string} modelType - Model type
   */
  processPredictionResults(predictionArray, config, modelType) {
    const { classes, threshold } = config;
    
    // Create class probabilities
    const classProbabilities = classes.map((className, index) => ({
      class: className,
      probability: predictionArray[index] || 0,
      confidence: Math.round((predictionArray[index] || 0) * 100)
    }));

    // Sort by probability (highest first)
    classProbabilities.sort((a, b) => b.probability - a.probability);
    
    // Determine primary prediction
    const primaryPrediction = classProbabilities[0];
    const isPositive = primaryPrediction.probability >= threshold;
    
    // Medical interpretation
    const medicalInterpretation = this.getMedicalInterpretation(
      primaryPrediction.class, 
      primaryPrediction.confidence, 
      modelType
    );

    return {
      modelType,
      prediction: primaryPrediction.class,
      confidence: primaryPrediction.confidence,
      probability: primaryPrediction.probability,
      isPositive,
      threshold: threshold * 100,
      allClasses: classProbabilities,
      medicalInterpretation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get medical interpretation of results
   * @param {string} predictedClass - Predicted class name
   * @param {number} confidence - Confidence percentage
   * @param {string} modelType - Model type
   */
  getMedicalInterpretation(predictedClass, confidence, modelType) {
    const interpretations = {
      pneumonia: {
        'Normal': `Normal chest X-ray. No signs of pneumonia detected (${confidence}% confidence).`,
        'Pneumonia': `Pneumonia detected in chest X-ray (${confidence}% confidence). Recommend medical consultation.`
      },
      brainTumor: {
        'No Tumor': `No brain tumor detected in scan (${confidence}% confidence).`,
        'Glioma': `Glioma type brain tumor detected (${confidence}% confidence). Immediate medical attention required.`,
        'Meningioma': `Meningioma type brain tumor detected (${confidence}% confidence). Medical consultation recommended.`,
        'Pituitary': `Pituitary tumor detected (${confidence}% confidence). Endocrinology consultation recommended.`
      },
      alzheimer: {
        'Non Demented': `No signs of dementia detected (${confidence}% confidence).`,
        'Very Mild Demented': `Very mild cognitive decline detected (${confidence}% confidence). Early monitoring recommended.`,
        'Mild Demented': `Mild cognitive impairment detected (${confidence}% confidence). Medical evaluation recommended.`,
        'Moderate Demented': `Moderate cognitive decline detected (${confidence}% confidence). Comprehensive medical assessment needed.`
      },
      tuberculosis: {
        'Normal': `Normal chest X-ray. No signs of tuberculosis detected (${confidence}% confidence).`,
        'Tuberculosis': `Tuberculosis detected in chest X-ray (${confidence}% confidence). Immediate medical attention required.`
      }
    };

    return interpretations[modelType]?.[predictedClass] || 
           `${predictedClass} detected with ${confidence}% confidence.`;
  }

  /**
   * Automatically detect which model to use based on image characteristics or metadata
   * @param {Buffer} imageBuffer - Image data
   * @param {Object} metadata - Image metadata (filename, type, etc.)
   */
  async autoDetectModelType(imageBuffer, metadata = {}) {
    const filename = metadata.filename || '';
    const filenameLower = filename.toLowerCase();
    
    // Simple heuristics based on filename/metadata
    if (filenameLower.includes('xray') || filenameLower.includes('chest') || filenameLower.includes('lung')) {
      return 'pneumonia';
    }
    
    if (filenameLower.includes('brain') || filenameLower.includes('ct') || filenameLower.includes('mri')) {
      // For brain scans, we'll default to brainTumor unless specifically indicated
      if (filenameLower.includes('alzheimer') || filenameLower.includes('dementia')) {
        return 'alzheimer';
      }
      return 'brainTumor';
    }
    
    if (filenameLower.includes('alzheimer') || filenameLower.includes('dementia')) {
      return 'alzheimer';
    }
    
    if (filenameLower.includes('tb') || filenameLower.includes('tuberculosis')) {
      return 'tuberculosis';
    }
    
    // Default fallback - could be enhanced with image analysis
    console.log('⚠️  Could not auto-detect model type, defaulting to pneumonia');
    return 'pneumonia';
  }

  /**
   * Get model information
   * @param {string} modelType - Model type
   */
  getModelInfo(modelType = null) {
    if (modelType) {
      return {
        modelType,
        ...this.modelConfigs[modelType],
        isLoaded: !!this.models[modelType]
      };
    }
    
    // Return info for all models
    return Object.keys(this.modelConfigs).map(type => ({
      modelType: type,
      ...this.modelConfigs[type],
      isLoaded: !!this.models[type]
    }));
  }

  /**
   * Dispose all models and free memory
   */
  dispose() {
    Object.keys(this.models).forEach(modelType => {
      if (this.models[modelType]) {
        this.models[modelType].dispose();
        this.models[modelType] = null;
      }
    });
    console.log('🗑️  All models disposed');
  }
}

// Create singleton instance
const realModelLoader = new RealModelLoader();

// Export functions for compatibility with existing code
module.exports = {
  // Main prediction function with auto model selection
  predict: async (imageInput, metadata = {}) => {
    const modelType = await realModelLoader.autoDetectModelType(imageInput, metadata);
    return await realModelLoader.predict(imageInput, modelType);
  },
  
  // Specific model predictions
  predictPneumonia: (imageInput) => realModelLoader.predict(imageInput, 'pneumonia'),
  predictBrainTumor: (imageInput) => realModelLoader.predict(imageInput, 'brainTumor'),
  predictAlzheimer: (imageInput) => realModelLoader.predict(imageInput, 'alzheimer'),
  predictTuberculosis: (imageInput) => realModelLoader.predict(imageInput, 'tuberculosis'),
  
  // Model management
  loadModel: (modelType) => realModelLoader.loadModel(modelType),
  loadAllModels: () => realModelLoader.loadAllModels(),
  getModelInfo: (modelType) => realModelLoader.getModelInfo(modelType),
  
  // Auto detection
  autoDetectModelType: (imageBuffer, metadata) => realModelLoader.autoDetectModelType(imageBuffer, metadata),
  
  // Validation and utilities
  validateInput: async (inputData) => {
    if (!inputData) {
      throw new Error('No input data provided');
    }
    
    if (!Buffer.isBuffer(inputData) && !(inputData instanceof tf.Tensor)) {
      throw new Error('Input must be a Buffer or TensorFlow.js Tensor');
    }
    
    return true;
  },
  
  // Cleanup
  dispose: () => realModelLoader.dispose(),
  
  // Expose the class for advanced usage
  RealModelLoader
};
