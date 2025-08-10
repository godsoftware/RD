import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import SimpleAuth from '../components/SimpleAuth';

/**
 * SimpleAuthPage - Simple authentication page
 * Redirects to dashboard if already authenticated
 */
const SimpleAuthPage = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show authentication form
  return <SimpleAuth />;
};

export default SimpleAuthPage;
