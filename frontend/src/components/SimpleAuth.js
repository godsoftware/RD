import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

/**
 * SimpleAuth component - Basic login/register form
 * Features: Toggle between login/register, simple validation
 */
const SimpleAuth = () => {
  const { login, startLogin, loginFailure, clearError, error, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Basic validation
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email gerekli';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli email girin';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    if (!isLogin) {
      if (!formData.username.trim()) {
        newErrors.username = 'Kullanıcı adı gerekli';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Kullanıcı adı en az 3 karakter olmalı';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    startLogin();

    try {
      let result;
      
      if (isLogin) {
        // Login
        result = await authService.login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });
        toast.success(`Hoş geldin, ${result.user.username}!`);
      } else {
        // Register
        result = await authService.register({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        });
        toast.success(`Hoş geldin, ${result.user.username}! Hesabın oluşturuldu.`);
      }

      login(result.user, result.token);
      
    } catch (error) {
      console.error('Auth error:', error);
      loginFailure(error.message);
      
      if (error.message.includes('already exists')) {
        toast.error('Bu email veya kullanıcı adı zaten kullanılıyor');
      } else if (error.message.includes('Invalid credentials')) {
        toast.error('Email veya şifre hatalı');
      } else {
        toast.error(error.message || 'Bir hata oluştu');
      }
    }
  };

  /**
   * Switch between login/register
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    clearError();
  };

  /**
   * Demo login
   */
  const handleDemoLogin = () => {
    setFormData({
      username: '',
      email: 'demo@medical.com',
      password: 'demo123',
      confirmPassword: ''
    });
    setIsLogin(true);
    setErrors({});
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1>🏥</h1>
          <h2>{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</h2>
          <p>
            {isLogin 
              ? 'Medikal görüntü analiz sistemine giriş yapın'
              : 'Yeni hesap oluşturun ve analiz yapmaya başlayın'
            }
          </p>
        </div>

        {/* Body */}
        <div className="auth-body">
          {error && (
            <div className="error-alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username (only for register) */}
            {!isLogin && (
              <div className="form-group">
                <label>Kullanıcı Adı</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Kullanıcı adınız"
                  disabled={loading}
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email adresiniz"
                disabled={loading}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Şifreniz"
                disabled={loading}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password (only for register) */}
            {!isLogin && (
              <div className="form-group">
                <label>Şifre Tekrar</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Şifrenizi tekrar girin"
                  disabled={loading}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {isLogin ? 'Giriş Yapılıyor...' : 'Hesap Oluşturuluyor...'}
                </>
              ) : (
                isLogin ? 'Giriş Yap' : 'Hesap Oluştur'
              )}
            </button>

            {/* Demo Button */}
            {isLogin && (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="demo-btn"
                disabled={loading}
              >
                🧪 Demo Hesabı Deneyin
              </button>
            )}
          </form>

          {/* Toggle Mode */}
          <div className="auth-toggle">
            <p>
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              <button
                type="button"
                onClick={toggleMode}
                className="toggle-btn"
                disabled={loading}
              >
                {isLogin ? 'Hesap Oluştur' : 'Giriş Yap'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .auth-card {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          max-width: 420px;
          width: 100%;
        }

        .auth-header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          padding: 3rem 2rem 2rem;
          text-align: center;
        }

        .auth-header h1 {
          font-size: 4rem;
          margin: 0 0 1rem 0;
        }

        .auth-header h2 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .auth-header p {
          opacity: 0.9;
          font-size: 1rem;
          margin: 0;
        }

        .auth-body {
          padding: 2rem;
        }

        .error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .form-group input {
          padding: 0.875rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: border-color 0.2s ease;
          background: #fafafa;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .error-text {
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .submit-btn {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 0.75rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .demo-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .demo-btn:hover:not(:disabled) {
          background: #4b5563;
        }

        .demo-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-toggle {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .auth-toggle p {
          color: #6b7280;
          margin: 0;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 600;
          margin-left: 0.5rem;
          text-decoration: underline;
          font-size: inherit;
        }

        .toggle-btn:hover:not(:disabled) {
          color: #1e40af;
        }

        .toggle-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 1rem;
          }

          .auth-header {
            padding: 2rem 1.5rem 1.5rem;
          }

          .auth-header h1 {
            font-size: 3rem;
          }

          .auth-header h2 {
            font-size: 1.5rem;
          }

          .auth-body {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleAuth;
