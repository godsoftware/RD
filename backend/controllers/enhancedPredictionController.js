const { validationResult } = require('express-validator');
const firebaseService = require('../services/firebaseService');
const geminiService = require('../services/geminiService');
const { predict, validateInput, getModelInfo, predictPneumonia, predictBrainTumor, predictTuberculosis } = require('../ml/loadModel');

// Geliştirilmiş model otomatik tespit fonksiyonu
async function autoDetectModelFromImage(file, patientInfo) {
  const filename = file.originalname.toLowerCase();
  const mimetype = file.mimetype.toLowerCase();
  
  // Dosya adı analizi
  const filenameScore = {
    pneumonia: 0,
    brainTumor: 0,
    tuberculosis: 0
  };
  
  // Pneumonia belirtileri
  if (filename.includes('xray') || filename.includes('chest') || filename.includes('lung') || 
      filename.includes('thorax') || filename.includes('pneumonia') || filename.includes('pneu')) {
    filenameScore.pneumonia += 3;
  }
  
  // Brain tumor belirtileri
  if (filename.includes('brain') || filename.includes('mri') || filename.includes('ct') ||
      filename.includes('head') || filename.includes('tumor') || filename.includes('glioma') ||
      filename.includes('meningioma') || filename.includes('cranial')) {
    filenameScore.brainTumor += 3;
  }
  
  // Tuberculosis belirtileri
  if (filename.includes('tb') || filename.includes('tuberculosis') || filename.includes('tbc') ||
      filename.includes('koch') || filename.includes('mycobacterium')) {
    filenameScore.tuberculosis += 3;
  }
  
  // Hasta bilgisi analizi
  if (patientInfo) {
    const symptoms = (patientInfo.symptoms || '').toLowerCase();
    const medicalHistory = (patientInfo.medicalHistory || '').toLowerCase();
    const combinedText = symptoms + ' ' + medicalHistory;
    
    // Pneumonia semptomları
    if (combinedText.includes('cough') || combinedText.includes('fever') || 
        combinedText.includes('chest pain') || combinedText.includes('breathing') ||
        combinedText.includes('öksürük') || combinedText.includes('ateş') ||
        combinedText.includes('göğüs ağrısı') || combinedText.includes('nefes')) {
      filenameScore.pneumonia += 2;
    }
    
    // Brain tumor semptomları
    if (combinedText.includes('headache') || combinedText.includes('seizure') ||
        combinedText.includes('vision') || combinedText.includes('memory') ||
        combinedText.includes('baş ağrısı') || combinedText.includes('nöbet') ||
        combinedText.includes('görme') || combinedText.includes('hafıza')) {
      filenameScore.brainTumor += 2;
    }
    
    // Tuberculosis semptomları
    if (combinedText.includes('night sweat') || combinedText.includes('weight loss') ||
        combinedText.includes('fatigue') || combinedText.includes('blood cough') ||
        combinedText.includes('gece terlemesi') || combinedText.includes('kilo kaybı') ||
        combinedText.includes('yorgunluk') || combinedText.includes('kanlı öksürük')) {
      filenameScore.tuberculosis += 2;
    }
  }
  
  // En yüksek skoru bulan model
  const maxScore = Math.max(...Object.values(filenameScore));
  
  if (maxScore === 0) {
    // Hiç eşleşme yoksa varsayılan olarak pneumonia
    console.log('🔍 No specific indicators found, defaulting to pneumonia model');
    return 'pneumonia';
  }
  
  const detectedModel = Object.keys(filenameScore).find(key => filenameScore[key] === maxScore);
  console.log('🎯 Model detection scores:', filenameScore);
  console.log(`✅ Selected model: ${detectedModel} (score: ${maxScore})`);
  
  return detectedModel;
}

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

    const userId = req.user?.uid || 'debug-user-123'; // DEBUG: Mock user for testing
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
        console.log('💾 Saving prediction to Firebase:', predictionData);
        savedPrediction = await firebaseService.savePrediction(predictionData);
        console.log('✅ Firebase save successful:', savedPrediction.id);
      } catch (saveError) {
        console.error('❌ Firebase save error:', saveError);
      }
    } else {
      console.log('⚠️ Firebase service not initialized, skipping save');
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
        console.log('🫁 Using Pneumonia model (manual selection)');
        aiResult = await predictPneumonia(file.buffer);
      } else if (modelType === 'brainTumor') {
        console.log('🧠 Using Brain Tumor model (manual selection)');
        aiResult = await predictBrainTumor(file.buffer);
      } else if (modelType === 'tuberculosis') {
        console.log('🦠 Using Tuberculosis model (manual selection)');
        aiResult = await predictTuberculosis(file.buffer);
      } else {
        // Geliştirilmiş otomatik model seçimi
        console.log('🤖 Auto-detecting best model for image...');
        const detectedModelType = await autoDetectModelFromImage(file, patientInfo);
        console.log(`📊 Auto-detected model: ${detectedModelType}`);
        
        if (detectedModelType === 'pneumonia') {
          aiResult = await predictPneumonia(file.buffer);
        } else if (detectedModelType === 'brainTumor') {
          aiResult = await predictBrainTumor(file.buffer);
        } else if (detectedModelType === 'tuberculosis') {
          aiResult = await predictTuberculosis(file.buffer);
        } else {
          // Fallback to general prediction
          aiResult = await predict(file.buffer, metadata);
        }
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

      // Debug: Model sonucunu konsola yazdır
      console.log('🎯 Final AI Result for Frontend:', JSON.stringify(finalResult, null, 2));

      // Firebase'de prediction'ı güncelle
      if (savedPrediction && firebaseService.isInitialized) {
        try {
          console.log('🔄 Updating Firebase prediction:', savedPrediction.id);
          await firebaseService.db.collection('predictions').doc(savedPrediction.id).update({
            result: finalResult,
            status: 'completed',
            completedAt: new Date(),
            processingTime: processingTime
          });
          console.log('✅ Firebase update successful');
        } catch (updateError) {
          console.error('❌ Firebase update error:', updateError);
        }
      } else {
        console.log('⚠️ Skipping Firebase update - no saved prediction or service not initialized');
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

      // Frontend için response formatını düzelt
      const responseData = {
        success: true,
        message: 'Enhanced prediction completed successfully',
        data: {
          prediction: finalResult,
          patientInfo: patientInfo,
          predictionId: savedPrediction?.id || null,
          imageUrl: uploadedFile?.publicUrl || null
        },
        // Backward compatibility için direkt prediction'ı da ekle
        prediction: finalResult
      };

      console.log('📤 Sending response to frontend:', JSON.stringify(responseData, null, 2));
      
      res.status(201).json(responseData);

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
    const userId = req.user?.uid || 'debug-user-123'; // DEBUG: Mock user for testing
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

    // Basit query kullan - index gerektirmeyen
    let query = firebaseService.db.collection('predictions')
      .where('userId', '==', userId)
      .limit(limit * page); // Daha fazla veri al, sonra filtrele

    // Pagination için offset kullanma, bunun yerine client-side pagination

    const snapshot = await query.get();
    let allPredictions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      allPredictions.push({
        id: doc.id,
        ...data
      });
    });

    // Client-side filtering ve sorting
    let filteredPredictions = allPredictions;

    // Patient ID filter
    if (patientId) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.patientInfo?.patientId === patientId
      );
    }

    // Model type filter
    if (modelType) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.result?.modelType === modelType
      );
    }

    // Sort by createdAt descending
    filteredPredictions.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    // Client-side pagination
    const totalCount = filteredPredictions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const predictions = filteredPredictions.slice(startIndex, endIndex);

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
    const userId = req.user?.uid || 'debug-user-123'; // DEBUG: Mock user for testing

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

    // Basit query - sadece userId ile filtrele
    const userPredictionsQuery = firebaseService.db.collection('predictions')
      .where('userId', '==', userId);

    const snapshot = await userPredictionsQuery.get();
    const allPredictions = [];
    
    snapshot.forEach(doc => {
      allPredictions.push(doc.data());
    });

    // Client-side date filtering
    const predictions = allPredictions.filter(pred => {
      if (!pred.createdAt) return false;
      const createdDate = pred.createdAt.toDate ? pred.createdAt.toDate() : new Date(pred.createdAt);
      return createdDate >= dateRange.startDate && createdDate <= dateRange.endDate;
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
