# 🔥 Firebase Configuration Instructions

## Patient History Verilerini Görmek İçin Firebase Kurulumu

Şu anda Patient History sayfasında **mock (test) verileri** görüyorsunuz. Gerçek Firebase verilerinizi görmek için aşağıdaki adımları takip edin:

## 📋 Hızlı Kurulum Adımları

### 1. Firebase Console'a Gidin
- https://console.firebase.google.com/ adresine gidin
- Mevcut projenizi seçin veya yeni bir proje oluşturun

### 2. Service Account Key Oluşturun
1. **Project Settings** > **Service accounts** sekmesine gidin
2. **Generate new private key** butonuna tıklayın
3. JSON dosyasını indirin

### 3. Backend .env Dosyası Oluşturun

`backend/.env` dosyası oluşturun ve aşağıdaki bilgileri girin:

```env
# Environment Configuration
NODE_ENV=development
PORT=5001

# Firebase Admin SDK Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your-client-cert-url

# Gemini AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 4. JSON Dosyasından Bilgileri Kopyalayın

İndirdiğiniz JSON dosyasından şu bilgileri `.env` dosyasına kopyalayın:
- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY` (Tam olarak, quotes ile)
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `client_id` → `FIREBASE_CLIENT_ID`
- `client_x509_cert_url` → `FIREBASE_CLIENT_CERT_URL`

### 5. Backend'i Yeniden Başlatın

Terminal'de:
```bash
cd backend
npm start
```

Başarılı olduğunda şu mesajları görmelisiniz:
```
✅ Firebase initialized successfully
📊 Project ID: your-project-id
✅ Firebase connected successfully
```

### 6. Frontend'i Yeniden Başlatın

Yeni terminal'de:
```bash
cd frontend
npm start
```

## 🔍 Kontrol Etme

1. http://localhost:5001/api/debug/env adresini ziyaret edin
2. Firebase değişkenlerinin **SET** olarak gösterildiğini kontrol edin
3. `firebaseInitialized: true` olduğunu kontrol edin

## 🎯 Sonuç

Firebase doğru configure edildikten sonra:
- ✅ Patient History gerçek verileri gösterecek
- ✅ Dashboard istatistikleri gerçek veriler olacak
- ✅ Kayıt/Giriş Firebase Authentication kullanacak
- ✅ Analizler Firestore'da saklanacak

## 🚨 Şu Anda Mock Data Kullanılıyor

Firebase configure edilmeden önce:
- Patient History'de 3 örnek analiz görünür
- Dashboard'da test istatistikleri görünür
- Veriler geçici bellekte tutulur

## 💡 İpucu

Firebase configure etmek istemiyorsanız, mock data ile uygulamayı test edebilirsiniz. Tüm özellikler çalışmaya devam edecektir, sadece veriler kalıcı olmayacaktır.
