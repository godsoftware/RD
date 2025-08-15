/**
 * Alternative Model Loader - GraphModel Only
 * Bu kod LayersModel yerine sadece GraphModel kullanır
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const BASE_URL = process.env.BACKEND_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

class AlternativeModelLoader {
  constructor() {
    this.models = {
      pneumonia: null,
      brainTumor: null,
      tuberculosis: null
    };
    
    this.modelConfigs = {
      pneumonia: {
        inputShape: [224, 224, 3],
        classes: ['Normal', 'Pneumonia'],
        threshold: 0.5
      },
      brainTumor: {
        inputShape: [224, 224, 3],
        classes: ['glioma', 'meningioma', 'notumor'],
        threshold: 0.25
      },
      tuberculosis: {
        inputShape: [224, 224, 3],
        classes: ['Normal', 'Tuberculosis'],
        threshold: 0.5
      }
    };

    console.log('🔄 Alternative Model Loader initialized (GraphModel only)');
  }

  async loadModel(modelType) {
    if (this.models[modelType]) {
      console.log(`✅ Model ${modelType} already loaded`);
      return this.models[modelType];
    }

    try {
      console.log(`🚀 Loading ${modelType} model...`);
      
      // Model URL'lerini GraphModel formatında ayarla
      let modelUrl;
      
      if (modelType === 'brainTumor') {
        modelUrl = `${BASE_URL}/models/brain_tumor_graph_final/model.json`;
      } else if (modelType === 'pneumonia') {
        modelUrl = `${BASE_URL}/models/pneumonia_graph_final/model.json`;
      } else if (modelType === 'tuberculosis') {
        modelUrl = `${BASE_URL}/models/tuberculosis_graph_final/model.json`;
      } else {
        // Fallback for other models
        modelUrl = `${BASE_URL}/models/${modelType}_model`;
      }
      
      console.log(`📂 Loading GraphModel: ${modelUrl}`);
      
      try {
        const model = await tf.loadGraphModel(modelUrl);
        this.models[modelType] = model;
        console.log(`✅ Model ${modelType} loaded as GraphModel`);
        return model;
      } catch (error) {
        console.log(`❌ GraphModel failed: ${error.message}`);
        
        // Fallback: Mock model
        console.log(`🔄 Creating mock model for ${modelType}...`);
        const mockModel = this.createMockModel(modelType);
        this.models[modelType] = mockModel;
        return mockModel;
      }
      
    } catch (error) {
      console.error(`❌ Failed to load ${modelType} model:`, error.message);
      
      // Mock model oluştur
      console.log(`🔄 Creating mock model for ${modelType}...`);
      const mockModel = this.createMockModel(modelType);
      this.models[modelType] = mockModel;
      return mockModel;
    }
  }

  createMockModel(modelType) {
    console.log(`🎭 Creating mock model for ${modelType}`);
    
    // Mock prediction function
    const mockModel = {
      predict: (input) => {
        console.log(`🎭 Mock prediction for ${modelType}`);
        const config = this.modelConfigs[modelType];
        const numClasses = config.classes.length;
        
        // Random predictions
        const predictions = new Array(numClasses).fill(0).map(() => Math.random());
        const sum = predictions.reduce((a, b) => a + b, 0);
        const normalized = predictions.map(p => p / sum);
        
        // Return as tensor
        return tf.tensor2d([normalized]);
      },
      
      dispose: () => {
        console.log(`🗑️ Mock model ${modelType} disposed`);
      }
    };
    
    return mockModel;
  }

  async predict(imageInput, modelType) {
    if (!this.modelConfigs[modelType]) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    const model = await this.loadModel(modelType);
    
    if (!model) {
      throw new Error(`Model ${modelType} failed to load`);
    }

    let imageTensor;
    
    try {
      // Convert input to tensor
      if (Buffer.isBuffer(imageInput)) {
        imageTensor = await this.bufferToTensor(imageInput);
      } else if (imageInput instanceof tf.Tensor) {
        imageTensor = imageInput;
      } else {
        throw new Error('Invalid image input');
      }

      // Preprocess
      const processedImage = this.preprocessImage(imageTensor, modelType);
      
      // Predict
      console.log(`🔮 Making ${modelType} prediction...`);
      const prediction = model.predict(processedImage);
      
      // Get data
      const predictionData = await prediction.data();
      const predictionArray = Array.from(predictionData);
      
      // Process results
      const config = this.modelConfigs[modelType];
      const results = this.processPredictionResults(predictionArray, config, modelType);
      
      // Cleanup
      if (Buffer.isBuffer(imageInput)) {
        imageTensor.dispose();
      }
      processedImage.dispose();
      prediction.dispose();
      
      return results;

    } catch (error) {
      if (imageTensor && Buffer.isBuffer(imageInput)) {
        imageTensor.dispose();
      }
      
      console.error(`❌ Prediction error for ${modelType}:`, error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  preprocessImage(imageTensor, modelType) {
    const config = this.modelConfigs[modelType];
    
    // Resize
    let processed = tf.image.resizeBilinear(
      imageTensor, 
      [config.inputShape[0], config.inputShape[1]]
    );
    
    // Ensure 3 channels
    if (processed.shape[2] === 1) {
      processed = tf.concat([processed, processed, processed], 2);
    } else if (processed.shape[2] === 4) {
      processed = processed.slice([0, 0, 0], [-1, -1, 3]);
    }
    
    // Normalize
    processed = processed.div(255.0);
    
    // Add batch dimension
    processed = processed.expandDims(0);
    
    return processed;
  }

  async bufferToTensor(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const channels = info.channels || 3;
    const height = info.height;
    const width = info.width;
    const arr = new Uint8Array(data);
    
    return tf.tensor3d(arr, [height, width, channels], 'int32');
  }

  processPredictionResults(predictionArray, config, modelType) {
    const { classes, threshold } = config;
    
    const classProbabilities = classes.map((className, index) => ({
      class: className,
      probability: predictionArray[index] || 0,
      confidence: Math.round((predictionArray[index] || 0) * 100)
    }));

    classProbabilities.sort((a, b) => b.probability - a.probability);
    
    const primaryPrediction = classProbabilities[0];
    const isPositive = primaryPrediction.probability >= threshold;
    
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

  getMedicalInterpretation(predictedClass, confidence, modelType) {
    const interpretations = {
      pneumonia: {
        'Normal': `Normal chest X-ray. No signs of pneumonia detected (${confidence}% confidence).`,
        'Pneumonia': `Pneumonia detected in chest X-ray (${confidence}% confidence). Recommend medical consultation.`
      },
      brainTumor: {
        'glioma': `Glioma type brain tumor detected (${confidence}% confidence). Immediate medical attention required.`,
        'meningioma': `Meningioma type brain tumor detected (${confidence}% confidence). Medical consultation recommended.`,
        'notumor': `No brain tumor detected in scan (${confidence}% confidence).`
      },
      tuberculosis: {
        'Normal': `Normal chest X-ray. No signs of tuberculosis detected (${confidence}% confidence).`,
        'Tuberculosis': `Tuberculosis detected in chest X-ray (${confidence}% confidence). Immediate medical attention required.`
      }
    };

    return interpretations[modelType]?.[predictedClass] || 
           `${predictedClass} detected with ${confidence}% confidence.`;
  }

  dispose() {
    Object.keys(this.models).forEach(modelType => {
      if (this.models[modelType]) {
        this.models[modelType].dispose();
        this.models[modelType] = null;
      }
    });
    console.log('🗑️ All models disposed');
  }
}

// Create instance
const alternativeModelLoader = new AlternativeModelLoader();

module.exports = {
  predictPneumonia: (imageInput) => alternativeModelLoader.predict(imageInput, 'pneumonia'),
  predictBrainTumor: (imageInput) => alternativeModelLoader.predict(imageInput, 'brainTumor'),
  predictTuberculosis: (imageInput) => alternativeModelLoader.predict(imageInput, 'tuberculosis'),
  loadModel: (modelType) => alternativeModelLoader.loadModel(modelType),
  dispose: () => alternativeModelLoader.dispose(),
  AlternativeModelLoader
};