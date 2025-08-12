# 🏥 Medical AI Image Analysis System - Complete Setup Guide

## 📋 **Overview**

Bu sistem, 3 farklı AI modeli ile medikal görüntü analizi yapar:

- **🫁 Pneumonia Detection** (X-ray images)
- **🧠 Brain Tumor Detection** (CT/MRI images)  
- **🧠 Alzheimer Detection** (MRI images)

## ⚡ MongoDB olmadan hızlı başlangıç (Demo Mode)

MongoDB bağlantısını henüz yapmadıysanız, sistemi hemen çalıştırmak için demo modunu açabilirsiniz. Bu modda kullanıcılar ve tahminler bellek içinde tutulur, AI sonuçları da demo/mock üretilir (gerçek model dosyası gerekmez).

1) `backend/.env` dosyasını minimal olarak oluşturun:

```env
NODE_ENV=development
PORT=5001

# Demo mod açık: MongoDB gerektirmez
DEMO_MODE=true

# Zorunlu: JWT için geçici bir secret (geliştirmede yeterli)
JWT_SECRET=dev-secret-change-later

# (İsteğe bağlı) Gerçek model dosyalarınız varsa yollarını ekleyin
# PNEUMONIA_MODEL_PATH=./ml/models/pneumonia_detection.h5
# BRAIN_TUMOR_MODEL_PATH=./ml/models/brain_tumor_detection.h5
# ALZHEIMER_MODEL_PATH=./ml/models/alzheimer_detection.h5
```

2) Çalıştırma:

```powershell
cd RD\backend
npm install
npm run dev
```

Bu şekilde MongoDB bağlantısı olmadan sistemi test edebilirsiniz. Hazır olduğunuzda demo modunu kapatıp (DEMO_MODE=false) aşağıdaki MongoDB adımlarına geçin.

## 🚀 **MANUAL SETUP STEPS**

### **1. MongoDB Atlas Setup**

1. **MongoDB Atlas'a gidin**: https://cloud.mongodb.com/
2. **Hesap oluşturun** (Free tier)
3. **Yeni cluster oluşturun** (M0 FREE)
4. **Database user oluşturun**:
   - Username/password kaydedin =ozkaleresull  tmLSnNzzUnGjwKAF
5. **Network Access** ayarlayın:
   - Add IP Address: `0.0.0.0/0` (veya specific IP)
6. **Connection String** kopyalayın

### **2. Backend .env File Update**

`backend/.env` dosyasını düzenleyin:

```bash
NODE_ENV=development
PORT=5001

# Real MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@your-cluster.xxxxx.mongodb.net/medical_ai_app?retryWrites=true&w=majority
MONGODB_URI_DEV=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@your-cluster.xxxxx.mongodb.net/medical_ai_app_dev?retryWrites=true&w=majority

# Switch to Production Mode (MongoDB kullanacaksanız kapatın)
DEMO_MODE=false

# JWT Secret (change this!)
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=7d

# AI Model Paths (create these directories)
PNEUMONIA_MODEL_PATH=./ml/models/pneumonia_detection.h5
BRAIN_TUMOR_MODEL_PATH=./ml/models/brain_tumor_detection.h5
ALZHEIMER_MODEL_PATH=./ml/models/alzheimer_detection.h5

# File Upload Limits
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### **3. Install Dependencies**

Backend'de TensorFlow.js dependencies'leri install edin:

```bash
cd backend
npm install
# TensorFlow.js packages are already added to package.json
```

### **4. AI Model Files**

**Bu klasörleri oluşturun:**

```bash
backend/ml/models/
└── README.md (already created)
```

**Model dosyalarınızı bu klasöre koyun:**
- `pneumonia_detection.h5` - Pneumonia AI model  
- `brain_tumor_detection.h5` - Brain tumor AI model
- `alzheimer_detection.h5` - Alzheimer AI model

#### Model yolları (path) nasıl çalışır?

- Yol değerleri backend çalıştırma dizinine göredir. Genelde komutları `RD/backend` altında çalıştırdığınız için `./ml/models/...` yolları doğru konuma işaret eder.
- Ortam değişkenleri verilmezse varsayılan yollar kullanılır:
  - Pneumonia: `./ml/models/pneumonia_detection.h5`
  - Brain Tumor: `./ml/models/brain_tumor_detection.h5`
  - Alzheimer: `./ml/models/alzheimer_detection.h5`
- İsterseniz mutlak yol verebilirsiniz (Windows örnekleri):
  - `PNEUMONIA_MODEL_PATH=C:\RD\RD\backend\ml\models\pneumonia_detection.h5`
  - `BRAIN_TUMOR_MODEL_PATH=C:\RD\RD\backend\ml\models\brain_tumor_detection.h5`
  - `ALZHEIMER_MODEL_PATH=C:\RD\RD\backend\ml\models\alzheimer_detection.h5`

Windows'ta klasörü hızlıca oluşturmak için:

```powershell
cd RD\backend
mkdir -Force .\ml\models
```

Ardından .h5 dosyalarınızı `RD\backend\ml\models\` klasörüne kopyalayın.

### **5. Model Acquisition Options**

**OPTION A: Use Your Own Models**
- Train your own models with TensorFlow/Keras
- Save as `.h5` format
- Place in `backend/ml/models/` folder

**OPTION B: Download Pre-trained Models**
- Check Kaggle for medical AI models
- GitHub repositories with pre-trained models
- Papers with Code implementations

**OPTION C: Demo Mode (Current)**
- Set `DEMO_MODE=true` in `.env`
- System will work with mock predictions

> Not: Demo modda gerçek model dosyaları şart değildir. Gerçek model kullanımına geçmek için: model dosyalarını belirtilen klasöre ekleyin, `.env` içine yol değişkenlerini (isteğe bağlı) doğrulayın ve `DEMO_MODE=false` yapın. MongoDB için de bağlantı bilgilerini eklemeyi unutmayın.

## 🔄 **API ENDPOINTS**

### **Authentication**
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET /api/auth/profile - Get user profile
```

### **AI Predictions**
```
POST /api/prediction/predict - Auto-detect model and predict
  - Form data with 'file' field
  - Optional 'modelType' field (pneumonia/brainTumor/alzheimer)

GET /api/prediction/history - Get prediction history
GET /api/prediction/stats - Get prediction statistics
DELETE /api/prediction/:id - Delete prediction
```

## 🎯 **AI Model Routing Logic**

### **Automatic Model Selection**

1. **Filename-based detection:**
   - `*xray*`, `*chest*`, `*lung*` → Pneumonia Model
   - `*brain*`, `*ct*`, `*mri*` → Brain Tumor Model  
   - `*alzheimer*`, `*dementia*` → Alzheimer Model

2. **Frontend selection:**
   - X-ray + Diagnosis → Pneumonia Model
   - CT/MRI + Diagnosis → Brain Tumor Model
   - MRI + Alzheimer → Alzheimer Model

### **Manual Model Selection**

Frontend'de model tipini belirtebilirsiniz:

```javascript
// Specific model predictions
predictionService.predictPneumonia(imageFile)
predictionService.predictBrainTumor(imageFile) 
predictionService.predictAlzheimer(imageFile)

// Auto-detection
predictionService.predictWithAutoDetection(imageFile)
```

## 🖥️ **Frontend Features**

### **Medical Image Upload Component**
- Drag & drop image upload
- Image type selection (X-ray, CT, MRI, Ultrasound)
- Analysis type selection (mapped to AI models)
- Patient information input
- Real-time AI model routing

### **Enhanced Results Display**
- Medical-specific confidence indicators
- AI model type identification
- Clinical recommendations
- Detailed medical interpretations

## 🚀 **Running the System**

### **Development Mode:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend  
npm start
```

### **Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### **Authentication:**
- Demo Mode: `demo@medical.com` / `demo123`
- Production: Create new accounts

## ⚠️ **Troubleshooting**

### **Common Issues:**

1. **TensorFlow.js + Node.js v22 Issues:**
   - Switch to Node.js v18 or v20
   - Or keep `DEMO_MODE=true`

2. **Model Loading Errors:**
   - Check model file paths
   - Verify model format (.h5 supported)
   - Check file permissions

3. **MongoDB Connection:**
   - Verify connection string
   - Check network access in Atlas
   - Ensure correct credentials

4. **Port Conflicts:**
   - Backend uses port 5001
   - Frontend uses port 3000
   - Change ports in server.js and package.json if needed

## 📊 **System Architecture**

```
Frontend (React)
├── Medical Image Upload Component
├── AI Model Selection Logic  
├── Results Display Components
└── Authentication Pages

Backend (Node.js/Express)
├── Real Authentication (MongoDB)
├── AI Model Router
├── 3 TensorFlow.js Models
├── File Upload Handler
└── Prediction API

AI Models
├── Pneumonia Detection (X-ray)
├── Brain Tumor Detection (CT/MRI)
└── Alzheimer Detection (MRI)
```

## 🔮 **Next Steps (Future Enhancements)**

1. **More AI Models:**
   - Skin cancer detection
   - Cardiac abnormalities
   - Bone fracture detection

2. **Advanced Features:**
   - DICOM file support
   - 3D medical imaging
   - Multi-sequence MRI analysis

3. **Clinical Integration:**
   - PACS system integration
   - HL7 FHIR compliance
   - Electronic health records

## 📞 **Support**

Eğer sorun yaşarsanız:

1. **Demo Mode Test:** `DEMO_MODE=true` ile test edin
2. **Console Logs:** Browser developer tools'da hataları kontrol edin
3. **Backend Logs:** Terminal'de backend loglarını izleyin
4. **Model Files:** AI model dosyalarının doğru klasörde olduğunu kontrol edin

## ✅ **Checklist**

- [ ] MongoDB Atlas cluster oluşturuldu
- [ ] .env dosyası güncellendi (`DEMO_MODE=false`)
- [ ] AI model dosyaları `backend/ml/models/` klasöründe
- [ ] Backend dependencies install edildi
- [ ] Frontend dependencies install edildi
- [ ] İki server da çalışıyor (port 5001 ve 3000)
- [ ] Gerçek kullanıcı hesabı oluşturulabildi
- [ ] Medical image upload test edildi
- [ ] AI predictions çalışıyor

**🎉 System Ready for Production Medical AI Analysis!**
