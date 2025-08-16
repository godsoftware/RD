const { validationResult } = require('express-validator');
const firebaseService = require('../services/firebaseService');
const geminiService = require('../services/geminiService');

// Undefined değerleri temizleyen fonksiyon
function sanitizePredictionData(predictionData) {
  console.log('🧹 Sanitizing prediction data...');
  console.log('📋 Original data keys:', Object.keys(predictionData));
  
  const sanitized = JSON.parse(JSON.stringify(predictionData)); // Deep copy
  
  // patientInfo undefined alanlarını temizle
  if (sanitized.patientInfo) {
    Object.keys(sanitized.patientInfo).forEach(key => {
      if (sanitized.patientInfo[key] === undefined || sanitized.patientInfo[key] === null) {
        console.log(`🗑️ Removing undefined/null field: patientInfo.${key}`);
        delete sanitized.patientInfo[key];
      }
    });
  }
  
  // imageInfo undefined alanlarını temizle
  if (sanitized.imageInfo) {
    Object.keys(sanitized.imageInfo).forEach(key => {
      if (sanitized.imageInfo[key] === undefined || sanitized.imageInfo[key] === null) {
        console.log(`🗑️ Removing undefined/null field: imageInfo.${key}`);
        delete sanitized.imageInfo[key];
      }
    });
  }
  
  // Root level undefined alanları temizle
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      console.log(`🗑️ Removing undefined/null field: ${key}`);
      delete sanitized[key];
    }
  });
  
  console.log('✅ Sanitized data keys:', Object.keys(sanitized));
  return sanitized;
}
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

    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    console.log('🎯 makeEnhancedPrediction called with userId:', userId);
    console.log('🔥 Firebase service initialized:', firebaseService.isInitialized);
    
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
        console.log('💾 Saving prediction to Firebase...');
        console.log('📋 Prediction data to save:', JSON.stringify(predictionData, null, 2));
        console.log('🔍 User ID in prediction data:', predictionData.userId);
        console.log('🔥 Firebase service status:', firebaseService.isInitialized);
        
        // Veriyi temizle (undefined/null değerleri kaldır)
        const sanitizedData = sanitizePredictionData(predictionData);
        
        savedPrediction = await firebaseService.savePrediction(sanitizedData);
        console.log('✅ Firebase save successful!');
        console.log('🆔 Saved prediction ID:', savedPrediction.id);
        console.log('📊 Prediction saved for user:', savedPrediction.userId);
        
        // Verify the save by reading it back
        try {
          const verifyDoc = await firebaseService.db.collection('predictions').doc(savedPrediction.id).get();
          console.log('🔍 Verification - Document exists:', verifyDoc.exists);
          if (verifyDoc.exists) {
            console.log('📄 Verification - Document data:', JSON.stringify(verifyDoc.data(), null, 2));
          }
        } catch (verifyError) {
          console.error('❌ Verification failed:', verifyError);
        }
        
      } catch (saveError) {
        console.error('❌ Firebase save error:', saveError);
        console.error('📋 Full error details:', {
          message: saveError.message,
          code: saveError.code,
          stack: saveError.stack
        });
      }
    } else {
      console.log('⚠️ Firebase service not initialized, skipping save');
      console.log('🔧 Firebase service state:', {
        isInitialized: firebaseService.isInitialized,
        db: !!firebaseService.db,
        auth: !!firebaseService.auth
      });
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
        console.log('📋 Update data:', {
          result: finalResult,
          status: 'completed',
          completedAt: new Date(),
          processingTime: processingTime
        });
        
        await firebaseService.db.collection('predictions').doc(savedPrediction.id).update({
          result: finalResult,
          status: 'completed',
          completedAt: new Date(),
          processingTime: processingTime
        });
        
        console.log('✅ Firebase update successful for prediction:', savedPrediction.id);
        console.log('📊 Prediction saved for user:', userId);
        
        // Verify the final document
        try {
          const finalDoc = await firebaseService.db.collection('predictions').doc(savedPrediction.id).get();
          console.log('🔍 Final verification - Document exists:', finalDoc.exists);
          if (finalDoc.exists) {
            const finalData = finalDoc.data();
            console.log('📄 Final document data:', {
              id: finalDoc.id,
              userId: finalData.userId,
              status: finalData.status,
              result: finalData.result ? 'Present' : 'Missing',
              createdAt: finalData.createdAt,
              completedAt: finalData.completedAt
            });
          }
        } catch (finalVerifyError) {
          console.error('❌ Final verification failed:', finalVerifyError);
        }
        
      } catch (updateError) {
        console.error('❌ Firebase update error:', updateError);
        console.error('📋 Update error details:', {
          message: updateError.message,
          code: updateError.code,
          stack: updateError.stack
        });
      }
    } else {
      console.log('⚠️ Skipping Firebase update - no saved prediction or service not initialized');
      console.log('🔍 Debug info:', {
        savedPrediction: !!savedPrediction,
        savedPredictionId: savedPrediction?.id,
        firebaseInitialized: firebaseService.isInitialized
      });
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
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const patientId = req.query.patientId;
    const modelType = req.query.modelType;

    console.log('📋 getEnhancedPredictionHistory called');
    console.log('👤 User ID:', userId);
    console.log('🔧 Firebase initialized:', firebaseService.isInitialized);

    // DEBUG: Return mock data if Firebase not available
    if (!firebaseService.isInitialized) {
      console.log('🚫 Firebase not initialized, returning enhanced mock data');
      const mockPredictions = [
        {
          id: 'mock-1',
          _id: 'mock-1',
          prediction: 'Pneumonia',
          confidence: 85.5,
          modelType: 'pneumonia',
          createdAt: new Date().toISOString(),
          status: 'completed',
          patientInfo: {
            patientName: 'John Doe',
            age: 45,
            gender: 'male'
          },
          result: {
            modelType: 'pneumonia',
            prediction: 'Pneumonia',
            confidence: 85.5,
            isPositive: true
          },
          geminiInterpretation: 'Akciğer grafisinde pnömoni bulguları tespit edilmiştir. Hasta 24 saat içinde uzman doktor kontrolüne başvurmalıdır.',
          diseaseInfo: 'Pnömoni akciğerlerin enfeksiyonudur ve tedavi edilebilir bir hastalıktır. Antibiyotik tedavisi ve dinlenme gereklidir.'
        },
        {
          id: 'mock-2',
          _id: 'mock-2',
          prediction: 'No tumor',
          confidence: 92.1,
          modelType: 'brainTumor',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          patientInfo: {
            patientName: 'Jane Smith',
            age: 35,
            gender: 'female'
          },
          result: {
            modelType: 'brainTumor',
            prediction: 'No tumor',
            confidence: 92.1,
            isPositive: false
          },
          geminiInterpretation: 'Beyin görüntülemesinde normal bulgular tespit edilmiştir. Tümör belirtisi görülmemiştir.',
          diseaseInfo: 'Normal beyin görüntülemesi sonucu. Herhangi bir anormallik tespit edilmemiştir.'
        },
        {
          id: 'mock-3',
          _id: 'mock-3',
          prediction: 'Tuberculosis',
          confidence: 78.3,
          modelType: 'tuberculosis',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed',
          patientInfo: {
            patientName: 'Ahmed Ali',
            age: 52,
            gender: 'male'
          },
          result: {
            modelType: 'tuberculosis',
            prediction: 'Tuberculosis',
            confidence: 78.3,
            isPositive: true
          },
          geminiInterpretation: 'Akciğer grafisinde tüberküloz bulgularına rastlanmıştır. Acil tıbbi müdahale gerektirir.',
          diseaseInfo: 'Tüberküloz bulaşıcı bir hastalıktır ve tedavi edilmesi zorunludur. Anti-TB tedavi başlatılmalıdır.'
        }
      ];

      return res.json({
        success: true,
        data: {
          predictions: mockPredictions,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalPredictions: mockPredictions.length,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Basit query kullan - index gerektirmeyen
    console.log('🔎 Querying Firestore predictions collection...');
    console.log('🔍 Looking for userId:', userId);
    console.log('🔧 Collection path: predictions');
    console.log('🔍 Query filter: userId ==', userId);
    
    // First, let's check if the collection exists and has any documents
    try {
      const allDocsSnapshot = await firebaseService.db.collection('predictions').limit(5).get();
      console.log('📊 Collection overview:');
      console.log('  - Total documents in collection:', allDocsSnapshot.size);
      console.log('  - Is collection empty:', allDocsSnapshot.empty);
      
      if (!allDocsSnapshot.empty) {
        console.log('📄 Sample documents in collection:');
        allDocsSnapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. Document ID: ${doc.id}`);
          console.log(`     User ID: ${data.userId}`);
          console.log(`     Prediction: ${data.prediction || data.result?.prediction || 'N/A'}`);
          console.log(`     Created: ${data.createdAt}`);
        });
      }
    } catch (overviewError) {
      console.error('❌ Collection overview failed:', overviewError);
    }
    
    let query = firebaseService.db.collection('predictions')
      .where('userId', '==', userId)
      .limit(limit * page); // Daha fazla veri al, sonra filtrele

    // Pagination için offset kullanma, bunun yerine client-side pagination

    const snapshot = await query.get();
    console.log('📊 Firestore query results:');
    console.log('  - Total documents found:', snapshot.size);
    console.log('  - Is snapshot empty:', snapshot.empty);
    
    let allPredictions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 Found prediction document:', {
        id: doc.id,
        userId: data.userId,
        prediction: data.prediction || data.result?.prediction,
        createdAt: data.createdAt
      });
      allPredictions.push({
        id: doc.id,
        ...data
      });
    });

    console.log('✅ Total predictions loaded:', allPredictions.length);

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
    const userId = req.user?.uid || 'debug-user-123'; // DEBUG: Mock user for testing

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
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    console.log('📊 getEnhancedPredictionStats called');
    console.log('👤 User ID:', userId);
    console.log('🔧 Firebase initialized:', firebaseService.isInitialized);

    // DEBUG: Return mock data if Firebase not available
    if (!firebaseService.isInitialized) {
      console.log('🚫 Firebase not initialized, returning enhanced mock stats');
      return res.json({
        success: true,
        data: {
          stats: {
            totalPredictions: 23,
            completedPredictions: 20,
            failedPredictions: 2,
            pendingPredictions: 1,
            avgConfidence: 87.3,
            successRate: 87.0,
            thisMonth: 12,
            thisWeek: 5,
            today: 2,
            modelTypeDistribution: {
              pneumonia: 8,
              brainTumor: 7,
              tuberculosis: 5,
              other: 3
            },
            confidenceDistribution: {
              high: 15, // >80%
              medium: 6, // 60-80%
              low: 2   // <60%
            },
            recentActivity: [
              { date: new Date().toISOString().split('T')[0], count: 2 },
              { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 3 },
              { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], count: 1 }
            ]
          }
        }
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
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

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
    const userId = req.user?.uid || 'debug-user-123'; // DEBUG: Mock user for testing
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
