# 🧠 RD Prediction System

A full-stack AI-powered prediction web application built with **React**, **Node.js**, **Express**, and **TensorFlow.js**. This application allows users to upload data files or input data manually to get AI-powered predictions with confidence scores.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with secure token management
- **User registration and login** with input validation
- **Protected routes** and middleware for secure API access
- **Password hashing** using bcrypt with salt rounds
- **Input sanitization** and validation on both frontend and backend

### 🤖 AI Prediction Engine
- **TensorFlow.js integration** for client-side and server-side ML
- **Multiple input methods**: File upload (CSV, JSON, images) or manual input
- **Real-time predictions** with confidence scores and processing time
- **Model validation** and error handling
- **Prediction history** tracking with metadata

### 📊 User Dashboard
- **Interactive dashboard** with prediction tools
- **Real-time statistics** and analytics
- **Prediction history** with filtering and pagination
- **Detailed results** with confidence levels and categories
- **Responsive design** for all device sizes

### 🎨 Modern UI/UX
- **Responsive design** with mobile-first approach
- **Intuitive drag & drop** file upload interface
- **Real-time form validation** with user-friendly error messages
- **Loading states** and progress indicators
- **Toast notifications** for user feedback
- **Dark/light theme support** (customizable)

## 🏗️ Architecture

```
RD-PREDICTION-SYSTEM/
├── backend/                    # Node.js + Express API
│   ├── controllers/           # Business logic
│   │   ├── authController.js  # Authentication endpoints
│   │   └── predictionController.js # Prediction logic
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── validation.js     # Input validation
│   ├── models/               # MongoDB schemas
│   │   ├── User.js          # User model
│   │   └── Prediction.js    # Prediction model
│   ├── ml/                  # Machine Learning
│   │   └── loadModel.js     # TensorFlow.js model loader
│   ├── routes/              # API routes
│   │   ├── auth.js         # Authentication routes
│   │   ├── prediction.js   # Prediction routes
│   │   └── index.js        # Main routes
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Dependencies and scripts
│   └── server.js          # Express server entry point
│
├── frontend/                 # React Application
│   ├── public/              # Static files
│   │   ├── index.html      # HTML template
│   │   └── manifest.json   # PWA manifest
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Navbar.js          # Navigation component
│   │   │   ├── UploadForm.js      # File upload & input form
│   │   │   ├── ResultCard.js      # Prediction results display
│   │   │   └── ProtectedRoute.js  # Route protection
│   │   ├── pages/          # Page components
│   │   │   ├── Home.js           # Landing page
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Register.js       # Registration page
│   │   │   └── Dashboard.js      # Main dashboard
│   │   ├── services/       # API services
│   │   │   ├── authService.js    # Authentication API calls
│   │   │   └── predictionService.js # Prediction API calls
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.js    # Authentication state
│   │   ├── App.js         # Main application component
│   │   ├── index.js       # React entry point
│   │   ├── App.css        # Application styles
│   │   └── index.css      # Global styles
│   └── package.json       # Dependencies and scripts
│
├── README.md              # Project documentation
└── .gitignore            # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rd-prediction-system.git
   cd rd-prediction-system
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
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/rd_prediction

   # JWT Secret (use a strong, random key in production)
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # File Upload Settings
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # Model Settings
   MODEL_PATH=./ml/model.h5
   ```

2. **Frontend Environment** - Create `frontend/.env` (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### 🗄️ Database Setup

1. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Database will be created automatically** when the backend starts.

### 🤖 AI Model Setup

1. **Prepare your TensorFlow model**:
   - If you have a `.h5` model file, place it in `backend/ml/model.h5`
   - The application will automatically load and use this model
   - For custom models, modify `backend/ml/loadModel.js`

2. **Convert Keras model to TensorFlow.js** (if needed):
   ```bash
   # Install tensorflowjs converter
   pip install tensorflowjs

   # Convert model
   tensorflowjs_converter --input_format=keras \
                         ./path/to/model.h5 \
                         ./backend/ml/
   ```

### 🔧 Running the Application

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev  # Development with nodemon
   # or
   npm start    # Production
   ```
   Backend will be available at: `http://localhost:5000`

2. **Start the frontend development server**:
   ```bash
   cd frontend
   npm start
   ```
   Frontend will be available at: `http://localhost:3000`

3. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000`
   - Register a new account or use the demo login
   - Start making predictions!

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### Prediction Endpoints

#### Make Prediction
```http
POST /api/prediction/predict
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "inputData": {
    "feature1": 1.5,
    "feature2": 2.3,
    "feature3": 4.1
  }
}
```

#### Get Prediction History
```http
GET /api/prediction/history?page=1&limit=10&status=completed
Authorization: Bearer <jwt_token>
```

#### Get Prediction Statistics
```http
GET /api/prediction/stats
Authorization: Bearer <jwt_token>
```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure environment variables** in Render dashboard
4. **Set build command**: `npm install`
5. **Set start command**: `npm start`
6. **Deploy!**

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard:
   - `REACT_APP_API_URL=https://your-backend-url.render.com/api`

### Production Environment Variables

**Backend (.env)**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rd_prediction
JWT_SECRET=your_production_jwt_secret_very_secure
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Run All Tests
```bash
# From project root
npm run test:all
```

## 🛠️ Development

### Code Style
- **ESLint** and **Prettier** configured for code consistency
- **Husky** pre-commit hooks for code quality
- **Conventional Commits** for commit messages

### Available Scripts

**Backend**:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint

**Frontend**:
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🔧 Customization

### Adding New Features

1. **Backend**: Add new routes in `backend/routes/`
2. **Frontend**: Add new components in `frontend/src/components/`
3. **Update API services** in `frontend/src/services/`

### Model Customization

1. **Modify input preprocessing** in `backend/ml/loadModel.js`
2. **Update prediction logic** in `backend/controllers/predictionController.js`
3. **Adjust frontend forms** in `frontend/src/components/UploadForm.js`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Model Loading Error**:
   - Ensure model file exists in `backend/ml/`
   - Check model file format compatibility
   - Verify TensorFlow.js version compatibility

3. **CORS Issues**:
   - Verify `FRONTEND_URL` in backend `.env`
   - Check CORS configuration in `server.js`

4. **Authentication Issues**:
   - Verify JWT secret configuration
   - Check token expiration settings
   - Ensure proper headers in frontend requests

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- **TensorFlow.js** for machine learning capabilities
- **React** team for the amazing frontend framework
- **Express.js** for the robust backend framework
- **MongoDB** for flexible data storage
- **Vercel** and **Render** for deployment platforms

## 📞 Support

For support, email support@yourapp.com or create an issue in this repository.

---

Made with ❤️ and ☕ by the RD Prediction Team
