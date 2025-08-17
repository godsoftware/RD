# 🧠 RD Medical AI Prediction System

A cutting-edge, full-stack AI-powered medical prediction web application built with **React**, **Node.js**, **Express**, **TensorFlow.js**, **Firebase**, and **Google Gemini AI**. This advanced system provides medical image analysis for brain tumors, pneumonia, and tuberculosis detection with AI-powered interpretations and personalized health recommendations.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Google AI](https://img.shields.io/badge/Google_AI-%23FF6F00.svg?style=for-the-badge&logo=google&logoColor=white)

## ✨ Advanced Features

### 🔐 Enhanced Authentication & Security
- **Firebase Authentication** with secure ID token management
- **Real-time user session management** with automatic token refresh
- **Protected API routes** with Firebase Admin SDK middleware
- **Role-based access control** (User, Doctor, Admin)
- **Advanced security headers** with Helmet.js
- **Rate limiting** protection against abuse (100 requests/15min)
- **CORS configuration** optimized for production

### 🤖 Advanced AI Prediction Engine
- **Multi-model AI system** for medical image analysis:
  - 🧠 **Brain Tumor Detection** - MRI/CT scan analysis
  - 🫁 **Pneumonia Detection** - X-ray chest analysis  
  - 🦠 **Tuberculosis Detection** - Chest X-ray analysis
- **TensorFlow.js integration** for client-side and server-side ML
- **Automatic model selection** based on image content and metadata
- **Real-time predictions** with confidence scores and processing time
- **Advanced error handling** and model validation
- **Model versioning** and performance tracking

### 🧠 Gemini AI Integration
- **Google Gemini AI-powered medical interpretation** of AI results
- **Personalized health recommendations** based on patient data
- **Disease information generation** for positive cases
- **Multi-language support** (English/Turkish medical terminology)
- **Context-aware medical insights** with patient history consideration

### 📊 Advanced User Dashboard
- **Real-time medical analytics** and prediction statistics
- **Patient management system** with medical history tracking
- **Advanced filtering** by model type, date range, and patient
- **Interactive charts** and data visualization
- **Export functionality** for medical reports
- **Responsive design** optimized for medical professionals

### 🎨 Modern Medical UI/UX
- **Medical-grade interface** designed for healthcare professionals
- **Intuitive drag & drop** medical image upload
- **Real-time form validation** with medical data standards
- **Loading states** and progress indicators for AI processing
- **Toast notifications** for medical alerts and results
- **Dark/light theme** support for different work environments
- **Mobile-responsive** design for point-of-care use

### 🔒 Data Security & Privacy
- **HIPAA-compliant data handling** for medical information
- **Firebase Firestore** secure document storage
- **Encrypted data transmission** with HTTPS
- **User data isolation** and privacy protection
- **Audit logging** for medical compliance

## 🏗️ Enhanced Architecture

```
RD-MEDICAL-AI-SYSTEM/
├── backend/                           # Node.js + Express API
│   ├── controllers/                  # Business logic
│   │   ├── enhancedPredictionController.js # Advanced AI prediction
│   │   ├── firebaseAuthController.js # Firebase authentication
│   │   └── patientsController.js     # Patient management
│   ├── middleware/                   # Custom middleware
│   │   ├── firebaseAuth.js          # Firebase authentication
│   │   ├── upload.js                # Medical image upload
│   │   └── validation.js            # Medical data validation
│   ├── ml/                          # Machine Learning
│   │   ├── models/                  # Pre-trained AI models
│   │   │   ├── brain_tumor_graph_final/    # Brain tumor detection
│   │   │   ├── pneumonia_graph_final/      # Pneumonia detection
│   │   │   └── tuberculosis_graph_final/   # Tuberculosis detection
│   │   ├── loadModel.js             # TensorFlow.js model loader
│   │   └── realModelLoader.js       # Production model management
│   ├── services/                    # External services
│   │   ├── firebaseService.js       # Firebase integration
│   │   └── geminiService.js         # Google Gemini AI service
│   ├── routes/                      # API routes
│   │   ├── enhancedPrediction.js    # AI prediction endpoints
│   │   ├── enhancedAuth.js          # Authentication routes
│   │   ├── patients.js              # Patient management
│   │   └── index.js                 # Main routes
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Dependencies and scripts
│   └── server.js                    # Express server entry point
│
├── frontend/                        # React Application
│   ├── public/                      # Static files
│   │   ├── index.html              # HTML template
│   │   └── manifest.json           # PWA manifest
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   │   ├── AdvancedMedicalUpload.js    # Medical image upload
│   │   │   ├── MedicalDashboard.js         # Medical dashboard
│   │   │   ├── MedicalResultCard.js        # Medical results display
│   │   │   ├── PatientHistory.js           # Patient history
│   │   │   ├── PredictionHistory.js        # Prediction tracking
│   │   │   ├── ProtectedRoute.js           # Route protection
│   │   │   └── SimpleAuth.js               # Authentication UI
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.js             # Landing page
│   │   │   ├── Login.js            # Login page
│   │   │   ├── Register.js         # Registration page
│   │   │   ├── Dashboard.js        # Main dashboard
│   │   │   ├── Profile.js          # User profile
│   │   │   └── SimpleAuthPage.js   # Authentication page
│   │   ├── services/               # API services
│   │   │   ├── enhancedAuthService.js      # Firebase auth
│   │   │   ├── enhancedPredictionService.js # AI prediction API
│   │   │   ├── firebaseConfig.js           # Firebase configuration
│   │   │   └── predictionService.js        # Legacy prediction API
│   │   ├── context/                # React Context
│   │   │   └── AuthContext.js      # Authentication state
│   │   ├── App.js                  # Main application component
│   │   ├── index.js                # React entry point
│   │   ├── App.css                 # Application styles
│   │   └── index.css               # Global styles
│   └── package.json                # Dependencies and scripts
│
├── FIREBASE_CONFIG_INSTRUCTIONS.md  # Firebase setup guide
├── MEDICAL_AI_SETUP_GUIDE.md       # AI model setup guide
├── DEPENDENCIES.md                  # Dependency documentation
├── README.md                        # Project documentation
└── .gitignore                       # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16.0.0 or higher)
- **Firebase project** with Firestore and Authentication enabled
- **Google Gemini AI API key**
- **npm** or **yarn** package manager

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rd-medical-ai-system.git
   cd rd-medical-ai-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### ⚙️ Environment Setup

1. **Backend Environment** - Create `backend/.env` file:
   ```env
   # Environment Configuration
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

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # File Upload Settings
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # Security
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Frontend Environment** - Create `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

### 🔥 Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project or use existing
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage (for medical images)

2. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download JSON file and extract values to `.env`

3. **Configure Firestore Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /predictions/{document} {
         allow read, write: if request.auth != null && 
                            request.auth.uid == resource.data.userId;
       }
       match /users/{userId} {
         allow read, write: if request.auth != null && 
                            request.auth.uid == userId;
       }
       match /patients/{patientId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 🤖 AI Model Setup

1. **Pre-trained Models Included**:
   - **Brain Tumor Detection**: `brain_tumor_graph_final/`
   - **Pneumonia Detection**: `pneumonia_graph_final/`
   - **Tuberculosis Detection**: `tuberculosis_graph_final/`

2. **Custom Model Integration**:
   - Place your `.h5` model files in `backend/ml/models/`
   - Update `backend/ml/loadModel.js` for custom preprocessing
   - Models automatically load on server startup

### 🔧 Running the Application

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev  # Development with nodemon
   # or
   npm start    # Production
   ```
   Backend will be available at: `http://localhost:5001`

2. **Start the frontend development server**:
   ```bash
   cd frontend
   npm start
   ```
   Frontend will be available at: `http://localhost:3000`

3. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000`
   - Register a new account with Firebase
   - Start analyzing medical images!

## 📚 Enhanced API Documentation

### Authentication Endpoints

#### Register User (Firebase)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "SecurePass123",
  "username": "Dr. Smith",
  "role": "doctor"
}
```

#### Login User (Firebase)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@hospital.com",
  "password": "SecurePass123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <firebase_id_token>
```

### Enhanced AI Prediction Endpoints

#### Make Enhanced Medical Prediction
```http
POST /api/prediction/enhanced
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data

Form Data:
- file: [medical_image.jpg]
- patientName: "John Doe"
- age: 45
- gender: "male"
- symptoms: "Chest pain, cough"
- medicalHistory: "Previous respiratory issues"
- modelType: "auto" (or "pneumonia", "brainTumor", "tuberculosis")
```

#### Get Enhanced Prediction Statistics
```http
GET /api/prediction/stats
Authorization: Bearer <firebase_id_token>
```

#### Get Enhanced Prediction History
```http
GET /api/prediction/history?page=1&limit=10&modelType=pneumonia
Authorization: Bearer <firebase_id_token>
```

#### Get Health Recommendations (Gemini AI)
```http
POST /api/prediction/recommendations
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "patientData": {
    "age": 45,
    "gender": "male",
    "symptoms": ["cough", "fever"],
    "diagnosis": "Pneumonia",
    "confidence": 87.5
  }
}
```

### Patient Management Endpoints

#### Get Patient History
```http
GET /api/patients/history?patientId=12345
Authorization: Bearer <firebase_id_token>
```

#### Update Patient Information
```http
PUT /api/patients/:patientId
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "name": "John Doe",
  "age": 45,
  "medicalHistory": ["Pneumonia 2023", "Annual checkup 2024"]
}
```

## 🚀 Advanced Deployment

### Backend Deployment (Render/Vercel)

1. **Environment Variables Setup**:
   ```env
   NODE_ENV=production
   PORT=5001
   FIREBASE_PROJECT_ID=your-production-project
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   GEMINI_API_KEY=your-production-gemini-key
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Build Commands**:
   ```bash
   npm install
   npm run build
   npm start
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Environment Variables**:
   ```env
   REACT_APP_API_URL=https://your-backend-domain.com/api
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   ```

2. **Build Commands**:
   ```bash
   npm install
   npm run build
   ```

## 🧪 Testing & Quality Assurance

### Backend Testing
```bash
cd backend
npm test
npm run lint
npm run test:coverage
```

### Frontend Testing
```bash
cd frontend
npm test
npm run lint
npm run build
```

### API Testing
```bash
# Test CORS
curl -X GET http://localhost:5001/api/cors-test

# Test Firebase connection
curl -X GET http://localhost:5001/api/debug/firestore

# Test environment
curl -X GET http://localhost:5001/api/debug/env
```

## 🛠️ Advanced Development

### Code Quality Tools
- **ESLint** with medical coding standards
- **Prettier** for consistent formatting
- **Husky** pre-commit hooks
- **Conventional Commits** for medical compliance

### Available Scripts

**Backend**:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run test:coverage` - Generate coverage report

**Frontend**:
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run eject` - Eject from Create React App

## 🔧 Advanced Customization

### Adding New Medical Models

1. **Model Integration**:
   ```bash
   # Place model files in backend/ml/models/
   backend/ml/models/your_model/
   ├── model.json
   ├── group1-shard1ofX.bin
   └── ...
   ```

2. **Update Model Loader**:
   ```javascript
   // backend/ml/loadModel.js
   const yourModel = await tf.loadGraphModel('/models/your_model/model.json');
   ```

3. **Add Prediction Logic**:
   ```javascript
   // backend/controllers/enhancedPredictionController.js
   if (modelType === 'yourModel') {
     result = await predictYourModel(file.buffer);
   }
   ```

### Custom Medical Data Processing

1. **Patient Data Validation**:
   ```javascript
   // backend/middleware/validation.js
   const medicalValidation = [
     body('patientId').isString().isLength({ min: 3 }),
     body('age').isInt({ min: 0, max: 150 }),
     body('symptoms').isArray().notEmpty()
   ];
   ```

2. **Medical Image Processing**:
   ```javascript
   // backend/middleware/upload.js
   const medicalImageFilter = (req, file, cb) => {
     if (file.mimetype.startsWith('image/')) {
       cb(null, true);
     } else {
       cb(new Error('Only medical images are allowed'));
     }
   };
   ```

## 🐛 Advanced Troubleshooting

### Firebase Issues

1. **Authentication Errors**:
   - Verify Firebase project configuration
   - Check service account key format
   - Ensure Firestore rules are correct

2. **Firestore Connection**:
   - Verify project ID and credentials
   - Check network connectivity
   - Ensure Firestore is enabled

### AI Model Issues

1. **Model Loading Errors**:
   - Verify model file integrity
   - Check TensorFlow.js version compatibility
   - Ensure proper model path configuration

2. **Prediction Failures**:
   - Check input image format and size
   - Verify model preprocessing requirements
   - Review error logs for specific issues

### Performance Issues

1. **Slow Predictions**:
   - Optimize image preprocessing
   - Consider model quantization
   - Implement caching for repeated requests

2. **Memory Issues**:
   - Monitor TensorFlow.js memory usage
   - Implement proper cleanup after predictions
   - Consider server-side model execution

## 🤝 Contributing to Medical AI

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/medical-ai-enhancement`
3. **Follow medical coding standards** and HIPAA compliance
4. **Test thoroughly** with medical data
5. **Document medical implications** of changes
6. **Commit your changes**: `git commit -m 'feat: add advanced brain tumor detection'`
7. **Push to the branch**: `git push origin feature/medical-ai-enhancement`
8. **Open a Pull Request** with detailed medical use case description

## 📄 License & Compliance

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.




**⚠️ Medical Disclaimer**: This system is for educational and research purposes. Always consult qualified healthcare professionals for medical diagnosis and treatment decisions.

Made with ❤️, ☕, and 🤖 by the RD Medical AI Team
