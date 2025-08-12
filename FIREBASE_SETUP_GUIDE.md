# 🔥 Firebase + Gemini AI Setup Guide

## 📋 Genel Bakış

Bu rehber, Medical AI uygulamanızı Firebase ve Gemini AI ile nasıl kuracağınızı adım adım açıklar.

### 🛠️ Kullanılan Teknolojiler:
- **Firebase Authentication** - Kullanıcı giriş/kayıt
- **Firebase Firestore** - NoSQL veritabanı
- **Firebase Storage** - Dosya depolama
- **Gemini AI** - Gelişmiş tıbbi yorumlama
- **TensorFlow.js** - AI model işleme

---

## 🔥 Firebase Kurulumu

### 1. Firebase Projesi Oluşturma

1. **Firebase Console'a gidin**: https://console.firebase.google.com/
2. **"Create a project"** tıklayın
3. **Proje adı** girin: `medical-ai-app`
4. **Google Analytics** etkinleştirin (isteğe bağlı)
5. **Create project** tıklayın

### 2. Firebase Authentication Kurulumu

1. **Authentication** > **Get started** tıklayın
2. **Sign-in method** sekmesine gidin
3. **Email/Password** metodunu etkinleştirin
4. **Users** sekmesinden test kullanıcıları ekleyebilirsiniz

### 3. Firestore Database Kurulumu

1. **Firestore Database** > **Create database** tıklayın
2. **Start in test mode** seçin (geliştirme için)
3. **Konum** seçin (Europe-west3 önerilir)
4. **Done** tıklayın

**Güvenlik Kuralları** (geliştirme için):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Predictions - users can read/write their own
    match /predictions/{predictionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // Patients - users can read/write their own
    match /patients/{patientId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid == request.resource.data.createdBy);
    }
  }
}
```

### 4. Firebase Storage Kurulumu

1. **Storage** > **Get started** tıklayın
2. **Start in test mode** seçin
3. **Done** tıklayın

**Storage Kuralları** (geliştirme için):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Medical images - authenticated users only
    match /medical-images/{imageId} {
      allow read, write: if request.auth != null;
    }
    
    // Reports - authenticated users only  
    match /reports/{reportId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Firebase Web App Yapılandırması

1. **Project Overview** > **Add app** > **Web** tıklayın
2. **App nickname** girin: `medical-ai-web`
3. **Firebase Hosting** kurulumu atlayın (şimdilik)
4. **Continue to console** tıklayın

**Firebase Config Bilgilerini Kopyalayın:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "medical-ai-app.firebaseapp.com",
  projectId: "medical-ai-app",
  storageBucket: "medical-ai-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### 6. Service Account Key Oluşturma (Backend İçin)

1. **Project Settings** > **Service accounts** sekmesi
2. **Generate new private key** tıklayın
3. **JSON dosyasını** indirin ve güvenli yerde saklayın

---

## 🤖 Gemini AI Kurulumu

### 1. Google AI Studio'ya Giriş

1. **Google AI Studio'ya gidin**: https://makersuite.google.com/app/apikey
2. **Google hesabınızla** giriş yapın
3. **Create API Key** tıklayın
4. **API Key'i** kopyalayın ve güvenli yerde saklayın

### 2. API Key Güvenliği

⚠️ **Önemli**: API key'inizi asla frontend kodunda kullanmayın! Sadece backend'de kullanın.

---

## 🔧 Uygulama Yapılandırması

### Backend Yapılandırması (.env dosyası)

`backend/.env` dosyasını oluşturun:

```env
# Environment Configuration
NODE_ENV=development
PORT=5001

# Firebase Admin SDK Configuration (Service Account bilgileri)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=medical-ai-app
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@medical-ai-app.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40medical-ai-app.iam.gserviceaccount.com

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Frontend Yapılandırması (.env.local dosyası)

`frontend/.env.local` dosyasını oluşturun:

```env
# Firebase Web Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=medical-ai-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=medical-ai-app
REACT_APP_FIREBASE_STORAGE_BUCKET=medical-ai-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop

# Backend API URL
REACT_APP_API_URL=http://localhost:5001/api
```

---

## 🚀 Uygulamayı Çalıştırma

### 1. Backend Çalıştırma

```bash
cd backend
npm install
npm run dev
```

**Başarılı çıktı:**
```
✅ Firebase connected successfully
🔥 Using Firebase Firestore as database
🔐 Firebase Authentication enabled
✅ Gemini AI initialized successfully
🤖 Real AI Model Loader initialized
Server is running on port 5001
```

### 2. Frontend Çalıştırma

```bash
cd frontend
npm install
npm start
```

**Başarılı çıktı:**
```
✅ Firebase initialized successfully
Compiled successfully!
Local: http://localhost:3000
```

---

## 📊 Veri Yapısı

### Firestore Collections

#### 1. `users` Collection
```javascript
{
  uid: "user_firebase_uid",
  email: "user@example.com",
  username: "John Doe",
  role: "user", // user, doctor, admin
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `predictions` Collection
```javascript
{
  id: "prediction_id",
  userId: "user_firebase_uid",
  patientInfo: {
    patientId: "PAT001234",
    patientName: "Jane Smith",
    age: 45,
    weight: 70.5,
    gender: "female",
    symptoms: "Chest pain, shortness of breath",
    medicalHistory: "Hypertension, diabetes"
  },
  imageInfo: {
    originalName: "chest_xray.jpg",
    size: 2048576,
    mimetype: "image/jpeg",
    firebaseUrl: "https://storage.googleapis.com/..."
  },
  result: {
    modelType: "pneumonia",
    prediction: "Pneumonia",
    confidence: 87,
    probability: 0.87,
    isPositive: true,
    medicalInterpretation: "Standard AI interpretation",
    geminiInterpretation: "Enhanced Gemini AI interpretation",
    diseaseInfo: "Detailed disease information",
    allClasses: [...],
    processingTime: 2500,
    enhancedAt: "2024-01-15T10:30:00Z"
  },
  status: "completed", // processing, completed, failed
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

#### 3. `patients` Collection
```javascript
{
  patientId: "PAT001234",
  name: "Jane Smith",
  age: 45,
  weight: 70.5,
  gender: "female",
  medicalHistory: ["Hypertension", "Diabetes"],
  createdAt: Timestamp,
  createdBy: "user_firebase_uid",
  lastPrediction: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔒 Güvenlik ve Üretim Ayarları

### 1. Firestore Güvenlik Kuralları (Üretim)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only own data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Predictions - only own predictions
    match /predictions/{predictionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Patients - only created by user
    match /patients/{patientId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.createdBy;
    }
    
    // Admin only collections
    match /admin/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 2. Storage Güvenlik Kuralları (Üretim)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Medical images - authenticated users only, max 10MB
    match /medical-images/{imageId} {
      allow read, write: if request.auth != null && 
        request.resource.size < 10 * 1024 * 1024;
    }
    
    // User can only access their own files
    match /user-files/{userId}/{imageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 3. Environment Variables Güvenliği

- **Asla** API key'leri veya private key'leri Git'e commit etmeyin
- **Production'da** çevre değişkenlerini güvenli şekilde yönetin
- **Private key'leri** escape karakterleri ile doğru formatta girin

---

## 🧪 Test Etme

### 1. Firebase Bağlantı Testi

Backend çalıştıktan sonra:
```bash
curl http://localhost:5001/api/
```

Başarılı yanıt:
```json
{
  "success": true,
  "message": "RD Prediction API is running",
  "version": "1.0.0"
}
```

### 2. Authentication Testi

Frontend'de test kullanıcısı oluşturun:
- Email: `test@medical.com`
- Password: `test123456`

### 3. Prediction Testi

1. Giriş yapın
2. Medikal görüntü yükleyin
3. Hasta bilgilerini doldurun (yaş, kilo)
4. Analiz edin
5. Gemini AI yorumunu kontrol edin

---

## 🚨 Sorun Giderme

### Firebase Bağlantı Sorunları

**Sorun**: Firebase initialization error
**Çözüm**: 
- Environment variables'ları kontrol edin
- Private key formatını kontrol edin (newline karakterleri)
- Service account permissions'ları kontrol edin

**Sorun**: Permission denied
**Çözüm**:
- Firestore rules'ları kontrol edin
- User authentication durumunu kontrol edin

### Gemini AI Sorunları

**Sorun**: Gemini AI not initialized
**Çözüm**:
- `GEMINI_API_KEY` environment variable'ını kontrol edin
- API key'in geçerli olduğunu kontrol edin
- Rate limiting kontrolü yapın

### Model Yükleme Sorunları

**Sorun**: Model file not found
**Çözüm**:
- Model dosyalarının `backend/ml/models/` klasöründe olduğunu kontrol edin
- Dosya isimlerini kontrol edin:
  - `best_pneumonia_model.h5`
  - `best_brain_tumor_model.h5`
  - `best_tb_model.h5`

---

## 📈 Üretim Dağıtımı

### Backend (Railway/Render)

1. **Environment variables** ayarlayın
2. **Build command**: `npm install`
3. **Start command**: `npm start`
4. **Health check**: `/api/`

### Frontend (Vercel/Netlify)

1. **Build command**: `npm run build`
2. **Output directory**: `build`
3. **Environment variables** ayarlayın

---

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

- 🔐 Firebase Authentication
- 🗄️ Firestore Database
- 📁 Firebase Storage
- 🤖 Gemini AI Integration
- 🏥 Medical Image Analysis
- 👥 Patient Management
- 📊 Analytics Dashboard
- 📱 Responsive Design

### 🚀 Gelecek Özellikler

- 📧 Email Notifications
- 📄 PDF Report Generation
- 🔄 Real-time Updates
- 👨‍⚕️ Multi-role Support
- 📈 Advanced Analytics
- 🌍 Multi-language Support

---

## 📞 Destek

Sorun yaşarsanız:

1. **Logs kontrol edin**: Browser console + Backend terminal
2. **Environment variables** kontrol edin
3. **Firebase console** kontrol edin
4. **Network requests** kontrol edin (Developer Tools)

**Demo Mode**: Firebase yapılandırılmamışsa otomatik demo mode'a geçer:
- Email: `demo@medical.com`
- Password: `demo123`

---

## 🎉 Başarılı Kurulum!

Tüm adımları tamamladıktan sonra:

1. ✅ Firebase Authentication çalışıyor
2. ✅ Firestore Database bağlı
3. ✅ Gemini AI aktif
4. ✅ AI Modelleri yüklü
5. ✅ Frontend ve Backend çalışıyor

**Artık tam özellikli Medical AI uygulamanız hazır!** 🏥✨
