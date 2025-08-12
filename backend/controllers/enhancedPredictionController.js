const { validationResult } = require('express-validator');
const firebaseService = require('../services/firebaseService');
const geminiService = require('../services/geminiService');
const { predict, validateInput, getModelInfo, predictPneumonia, predictBrainTumor, predictTuberculosis } = require('../ml/loadModel');

// @desc    Make enhanced prediction with Firebase + Gemini AI
// @route   POST /api/prediction/predict
// @access  Private
const makeEnhancedPrediction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.uid;
    const file = req.file;
    
    // Patient bilgilerini al
    const patientInfo = {
      patientId: req.body.patientId,
      patientName: req.body.patientName,
      age: parseInt(req.body.age) || null,
      weight: parseFloat(req.body.weight) || null,
      gender: req.body.gender,
      symptoms: req.body.symptoms,
      medicalHistory: req.body.medicalHistory
    };

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Medical image file is required'
      });
    }

    // Firebase Storage'a görüntüyü yükle
    let uploadedFile = null;
    if (firebaseService.isInitialized) {
      try {
        uploadedFile = await firebaseService.uploadMedicalImage(
          file.buffer,
          file.originalname,
          {
            contentType: file.mimetype,
            patientId: patientInfo.patientId,
            uploadedBy: userId
          }
        );
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }

    // Prediction başlangıç verisi
    const predictionData = {
      userId: userId,
      patientInfo: patientInfo,
      imageInfo: {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        firebaseUrl: uploadedFile?.publicUrl || null
      },
      status: 'processing',
      createdAt: new Date(),
      modelVersion: '1.0'
    };

    // Firebase'e prediction kaydı oluştur
    let savedPrediction = null;
    if (firebaseService.isInitialized) {
      try {
        savedPrediction = await firebaseService.savePrediction(predictionData);
      } catch (saveError) {
        console.error('Firebase save error:', saveError);
      }
    }

    try {
      // AI Model ile tahmin yap
      const startTime = Date.now();
      let aiResult;
      
      const modelType = req.body.modelType;
      const metadata = {
        filename: file.originalname,
        patientInfo: patientInfo
      };

      if (modelType === 'pneumonia') {
        aiResult = await predictPneumonia(file.buffer);
      } else if (modelType === 'brainTumor') {
        aiResult = await predictBrainTumor(file.buffer);
      } else if (modelType === 'tuberculosis') {
        aiResult = await predictTuberculosis(file.buffer);
      } else {
        // Otomatik model seçimi
        aiResult = await predict(file.buffer, metadata);
      }

      const processingTime = Date.now() - startTime;

      // Gemini AI ile gelişmiş yorumlama
      let geminiInterpretation = null;
      let diseaseInfo = null;
      
      try {
        // Tıbbi yorumlama
        geminiInterpretation = await geminiService.generateMedicalInterpretation(aiResult, patientInfo);
        
        // Hastalık bilgisi (eğer pozitif sonuç varsa)
        if (aiResult.isPositive && aiResult.prediction !== 'Normal') {
          diseaseInfo = await geminiService.generateDiseaseInfo(aiResult.prediction, patientInfo);
        }
      } catch (geminiError) {
        console.error('Gemini AI error:', geminiError);
      }

      // Sonuç verilerini hazırla
      const finalResult = {
        ...aiResult,
        processingTime: processingTime,
        geminiInterpretation: geminiInterpretation?.interpretation || null,
        diseaseInfo: diseaseInfo?.diseaseInfo || null,
        originalInterpretation: aiResult.medicalInterpretation,
        enhancedAt: new Date().toISOString()
      };

      // Firebase'de prediction'ı güncelle
      if (savedPrediction && firebaseService.isInitialized) {
        try {
          await firebaseService.db.collection('predictions').doc(savedPrediction.id).update({
            result: finalResult,
            status: 'completed',
            completedAt: new Date(),
            processingTime: processingTime
          });
        } catch (updateError) {
          console.error('Firebase update error:', updateError);
        }
      }

      // Patient kaydı yoksa oluştur/güncelle
      if (patientInfo.patientId && firebaseService.isInitialized) {
        try {
          const patientRef = firebaseService.db.collection('patients').doc(patientInfo.patientId);
          const patientDoc = await patientRef.get();
          
          if (!patientDoc.exists) {
            // Yeni patient oluştur
            await patientRef.set({
              patientId: patientInfo.patientId,
              name: patientInfo.patientName,
              age: patientInfo.age,
              weight: patientInfo.weight,
              gender: patientInfo.gender,
              medicalHistory: patientInfo.medicalHistory ? [patientInfo.medicalHistory] : [],
              createdAt: new Date(),
              createdBy: userId,
              lastPrediction: new Date()
            });
          } else {
            // Mevcut patient'ı güncelle
            await patientRef.update({
              lastPrediction: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (patientError) {
          console.error('Patient save error:', patientError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Enhanced prediction completed successfully',
        data: {
          prediction: finalResult,
          patientInfo: patientInfo,
          predictionId: savedPrediction?.id || null,
          imageUrl: uploadedFile?.publicUrl || null
        }
      });

    } catch (predictionError) {
      console.error('AI Prediction error:', predictionError);
      
      // Firebase'de hata durumunu kaydet
      if (savedPrediction && firebaseService.isInitialized) {
        try {
          await firebaseService.db.collection('predictions').doc(savedPrediction.id).update({
            status: 'failed',
            errorMessage: predictionError.message,
            failedAt: new Date()
          });
        } catch (updateError) {
          console.error('Firebase error update failed:', updateError);
        }
      }

      throw predictionError;
    }

  } catch (error) {
    console.error('Enhanced prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced prediction failed: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get prediction history from Firebase
// @route   GET /api/prediction/history
// @access  Private
const getEnhancedPredictionHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const modelType = req.query.modelType;

    if (!firebaseService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Firebase service not available'
      });
    }

    let query = firebaseService.db.collection('predictions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (patientId) {
      query = query.where('patientInfo.patientId', '==', patientId);
    }

    if (modelType) {
      query = query.where('result.modelType', '==', modelType);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const snapshot = await query.get();
    const predictions = [];
    
    snapshot.forEach(doc => {
      predictions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Total count için ayrı query
    let countQuery = firebaseService.db.collection('predictions')
      .where('userId', '==', userId);
    
    if (patientId) {
      countQuery = countQuery.where('patientInfo.patientId', '==', patientId);
    }
    
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;

    res.json({
      success: true,
      data: {
        predictions: predictions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalPredictions: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get enhanced prediction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get prediction by ID from Firebase
// @route   GET /api/prediction/:id
// @access  Private
const getEnhancedPredictionById = async (req, res) => {
  try {
    const predictionId = req.params.id;
    const userId = req.user.uid;

    if (!firebaseService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Firebase service not available'
      });
    }

    const doc = await firebaseService.db.collection('predictions').doc(predictionId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    const predictionData = doc.data();
    
    // Kullanıcı kontrolü
    if (predictionData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        prediction: {
          id: doc.id,
          ...predictionData
        }
      }
    });

  } catch (error) {
    console.error('Get enhanced prediction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get enhanced prediction statistics
// @route   GET /api/prediction/stats
// @access  Private
const getEnhancedPredictionStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!firebaseService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Firebase service not available'
      });
    }

    // Firebase'den analytics al
    const dateRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Son 30 gün
      endDate: new Date()
    };

    const userPredictionsQuery = firebaseService.db.collection('predictions')
      .where('userId', '==', userId)
      .where('createdAt', '>=', dateRange.startDate)
      .where('createdAt', '<=', dateRange.endDate);

    const snapshot = await userPredictionsQuery.get();
    const predictions = [];
    
    snapshot.forEach(doc => {
      predictions.push(doc.data());
    });

    // İstatistikleri hesapla
    const stats = {
      totalPredictions: predictions.length,
      completedPredictions: predictions.filter(p => p.status === 'completed').length,
      failedPredictions: predictions.filter(p => p.status === 'failed').length,
      modelDistribution: {},
      averageConfidence: 0,
      positiveResults: 0,
      averageProcessingTime: 0,
      recentActivity: predictions.slice(0, 5)
    };

    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let completedCount = 0;

    predictions.forEach(pred => {
      if (pred.result) {
        // Model dağılımı
        const modelType = pred.result.modelType || 'unknown';
        stats.modelDistribution[modelType] = (stats.modelDistribution[modelType] || 0) + 1;

        // Güven ortalaması
        if (pred.result.confidence) {
          totalConfidence += pred.result.confidence;
          completedCount++;
        }

        // Pozitif sonuçlar
        if (pred.result.isPositive) {
          stats.positiveResults++;
        }

        // İşlem süresi
        if (pred.processingTime) {
          totalProcessingTime += pred.processingTime;
        }
      }
    });

    if (completedCount > 0) {
      stats.averageConfidence = Math.round(totalConfidence / completedCount);
      stats.averageProcessingTime = Math.round(totalProcessingTime / completedCount);
    }

    res.json({
      success: true,
      data: {
        stats: stats,
        dateRange: dateRange
      }
    });

  } catch (error) {
    console.error('Get enhanced prediction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prediction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete prediction from Firebase
// @route   DELETE /api/prediction/:id
// @access  Private
const deleteEnhancedPrediction = async (req, res) => {
  try {
    const predictionId = req.params.id;
    const userId = req.user.uid;

    if (!firebaseService.isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Firebase service not available'
      });
    }

    const doc = await firebaseService.db.collection('predictions').doc(predictionId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    const predictionData = doc.data();
    
    // Kullanıcı kontrolü
    if (predictionData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Firebase Storage'dan dosyayı da sil
    if (predictionData.imageInfo?.firebaseUrl) {
      try {
        const fileName = predictionData.imageInfo.firebaseUrl.split('/').pop();
        await firebaseService.deleteFile(`medical-images/${fileName}`);
      } catch (deleteFileError) {
        console.error('File deletion error:', deleteFileError);
      }
    }

    // Firestore'dan prediction'ı sil
    await firebaseService.db.collection('predictions').doc(predictionId).delete();

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });

  } catch (error) {
    console.error('Delete enhanced prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get health recommendations using Gemini AI
// @route   POST /api/prediction/recommendations
// @access  Private
const getHealthRecommendations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { patientData } = req.body;

    if (!patientData) {
      return res.status(400).json({
        success: false,
        message: 'Patient data is required'
      });
    }

    const recommendations = await geminiService.generateHealthRecommendations(patientData);

    res.json({
      success: true,
      data: {
        recommendations: recommendations,
        generatedFor: userId,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get health recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate health recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  makeEnhancedPrediction,
  getEnhancedPredictionHistory,
  getEnhancedPredictionById,
  getEnhancedPredictionStats,
  deleteEnhancedPrediction,
  getHealthRecommendations
};
