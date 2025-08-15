import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PredictionHistory from './components/PredictionHistory';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Services
import { enhancedAuthService } from './services/enhancedAuthService';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Styles
import './App.css';

function AppContent() {
  const { user, loading, login } = useAuth();

  useEffect(() => {
    // Auto-login if token exists
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const profile = await enhancedAuthService.getProfile();
          login(profile, token);
        } catch (error) {
          console.error('Auto-login failed:', error);
          localStorage.removeItem('token');
        }
      }
    };

    autoLogin();
  }, [user, login]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          {null}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PredictionHistory />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
