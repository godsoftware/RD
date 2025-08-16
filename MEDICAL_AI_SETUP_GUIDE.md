# 🏥 Medical AI Image Analysis System - Complete Setup Guide

## 📋 **Overview**

Bu sistem, 3 farklı AI modeli ile medikal görüntü analizi yapar:

- **🫁 Pneumonia Detection** (X-ray images)
- **🧠 Brain Tumor Detection** (CT/MRI images)  
 

## ⚡ Firebase olmadan hızlı başlangıç (Demo Mode)

Firebase bağlantısını henüz yapmadıysanız, sistemi hemen çalıştırmak için demo modunu açabilirsiniz. Bu modda kullanıcılar ve tahminler bellek içinde tutulur, AI sonuçları da demo/mock üretilir (gerçek model dosyası gerekmez).

1) `backend/.env` dosyasını minimal olarak oluşturun:

```env
NODE_ENV=development
PORT=5001

# Demo mod açık: Firebase gerektirmez
DEMO_MODE=true

# Zorunlu: JWT için geçici bir secret (geliştirmede yeterli)
JWT_SECRET=dev-secret-change-later

# (İsteğe bağlı) Gerçek model dosyalarınız varsa TFJS yollarını ekleyin
# PNEUMONIA_MODEL_PATH=./ml/models/pneumonia_tfjs/model.json
# BRAIN_TUMOR_MODEL_PATH=./ml/models/brain_tumor_tfjs/model.json
# TUBERCULOSIS_MODEL_PATH=./ml/models/tb_tfjs/model.json
 
```

2) Çalıştırma:

```powershell
cd RD\backend
npm install
npm run dev
```

Bu şekilde Firebase bağlantısı olmadan sistemi test edebilirsiniz. Hazır olduğunuzda demo modunu kapatıp (DEMO_MODE=false) aşağıdaki Firebase adımlarına geçin.

## 🚀 **MANUAL SETUP STEPS**

### **1. Firebase Setup**

1. **Firebase Console'a gidin**: https://console.firebase.google.com/
2. **Yeni proje oluşturun** (veya mevcut projeyi kullanın)
3. **Authentication'ı etkinleştirin** (Email/Password)
4. **Firestore Database'i etkinleştirin**
5. **Storage'ı etkinleştirin** (medikal görüntüler için)
6. **Service Account Key oluşturun**:
   - Project Settings > Service Accounts
   - Generate new private key
   - JSON dosyasını indirin

### **2. Backend .env File Update**

`backend/.env` dosyasını düzenleyin:

```bash
NODE_ENV=development
PORT=5001

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Switch to Production Mode (Firebase kullanacaksanız kapatın)
DEMO_MODE=false

# AI Model Paths (TFJS)
PNEUMONIA_MODEL_PATH=./ml/models/pneumonia_tfjs/model.json
BRAIN_TUMOR_MODEL_PATH=./ml/models/brain_tumor_tfjs/model.json
TUBERCULOSIS_MODEL_PATH=./ml/models/tb_tfjs/model.json
 

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

**TFJS model klasörlerini bu klasöre koyun:**
- `pneumonia_tfjs/model.json` + shard `.bin` dosyaları
- `brain_tumor_tfjs/model.json` + shard `.bin` dosyaları
- `tb_tfjs/model.json` + shard `.bin` dosyaları
 

#### Model yolları (path) nasıl çalışır?

- Yol değerleri backend çalıştırma dizinine göredir. Genelde komutları `RD/backend` altında çalıştırdığınız için `./ml/models/...` yolları doğru konuma işaret eder.
- Ortam değişkenleri verilmezse varsayılan yollar kullanılır:
  - Pneumonia: `./ml/models/pneumonia_tfjs/model.json`
  - Brain Tumor: `./ml/models/brain_tumor_tfjs/model.json`
  - Tuberculosis: `./ml/models/tb_tfjs/model.json`
 
- İsterseniz mutlak yol verebilirsiniz (Windows örnekleri):
  - `PNEUMONIA_MODEL_PATH=C:\RD\RD\backend\ml\models\pneumonia_tfjs\model.json`
  - `BRAIN_TUMOR_MODEL_PATH=C:\RD\RD\backend\ml\models\brain_tumor_tfjs\model.json`
  - `TUBERCULOSIS_MODEL_PATH=C:\RD\RD\backend\ml\models\tb_tfjs\model.json`
 

Windows'ta klasörü hızlıca oluşturmak için:

```powershell
cd RD\backend
mkdir -Force .\ml\models
```

Ardından TFJS model klasörlerinizi `RD\backend\ml\models\` altına kopyalayın.

### **5. Model Acquisition Options**

**OPTION A: Use Your Own Models**
- Train your own models with TensorFlow/Keras
- Convert to TFJS (browser/Node CPU):
  ```bash
  tensorflowjs_converter --input_format keras \
      path/to/your_model.h5 \
      ./backend/ml/models/your_model_tfjs
  ```
- Place the TFJS folder under `backend/ml/models/`

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
  - Optional 'modelType' field (pneumonia/brainTumor/tuberculosis)

GET /api/prediction/history - Get prediction history
GET /api/prediction/stats - Get prediction statistics
DELETE /api/prediction/:id - Delete prediction
```

## 🎯 **AI Model Routing Logic**

### **Automatic Model Selection**

1. **Filename-based detection:**
   - `*xray*`, `*chest*`, `*lung*` → Pneumonia Model
   - `*brain*`, `*ct*`, `*mri*` → Brain Tumor Model  

2. **Frontend selection:**
   - X-ray + Diagnosis → Pneumonia Model
   - CT/MRI + Diagnosis → Brain Tumor Model

### **Manual Model Selection**

Frontend'de model tipini belirtebilirsiniz:

```javascript
// Specific model predictions
 predictionService.predictPneumonia(imageFile)
 predictionService.predictBrainTumor(imageFile) 

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
   - Verify model format (TFJS `model.json` + `.bin` shards)
   - Check file permissions

3. **Firebase Connection:**
   - Verify Firebase project configuration
   - Check service account key format
   - Ensure Firestore rules are correct

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
├── Real Authentication (Firebase)
├── AI Model Router
├── 3 TensorFlow.js Models
├── File Upload Handler
└── Prediction API

AI Models
├── Pneumonia Detection (X-ray)
├── Brain Tumor Detection (CT/MRI)
└── Tuberculosis Detection (X-ray)
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

- [ ] Firebase project oluşturuldu
- [ ] Authentication, Firestore ve Storage etkinleştirildi
- [ ] Service account key oluşturuldu ve .env'e eklendi
- [ ] .env dosyası güncellendi (`DEMO_MODE=false`)
- [ ] AI model dosyaları `backend/ml/models/` klasöründe
- [ ] Backend dependencies install edildi
- [ ] Frontend dependencies install edildi
- [ ] İki server da çalışıyor (port 5001 ve 3000)
- [ ] Gerçek kullanıcı hesabı oluşturulabildi
- [ ] Medical image upload test edildi
- [ ] AI predictions çalışıyor

**🎉 System Ready for Production Medical AI Analysis!**
