import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { enhancedAuthService } from '../services/enhancedAuthService';

/**
 * Login page component - User authentication form
 * Features: Email/password login, form validation, loading states, error handling
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, startLogin, loginFailure, clearError, error, loading } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear any existing errors on component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
      const { user, token } = await enhancedAuthService.login(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      login(user, token);
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      loginFailure(error.message || 'Login failed');
      toast.error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  /**
   * Handle demo/test login
   */
  // Demo login removed

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your AI prediction dashboard</p>
        </div>

        {/* Body */}
        <div className="auth-body">
          {/* Display general error */}
          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${validationErrors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
                required
              />
              {validationErrors.email && (
                <div className="form-error">{validationErrors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <div className="form-error">{validationErrors.password}</div>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="form-extras">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => toast.info('Password reset feature coming soon!')}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {null}
          </form>

          {/* Sign Up Link */}
          <div className="auth-link">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="auth-info">
        <div className="info-card">
          <h3>🚀 Get Started in Seconds</h3>
          <p>
            Access powerful AI prediction tools with just your email and password. 
            No complex setup required.
          </p>
        </div>
        
        <div className="info-card">
          <h3>🔒 Your Data is Secure</h3>
          <p>
            We use industry-standard encryption and security practices to protect 
            your account and prediction data.
          </p>
        </div>
      </div>

      <style jsx="true">{`
        .auth-container {
          min-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .auth-header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 2.5rem 2rem;
          text-align: center;
        }

        .auth-header h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          opacity: 0.9;
          font-size: 1rem;
        }

        .auth-body {
          padding: 2rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .error-icon {
          flex-shrink: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
          font-size: 1.1rem;
        }

        .password-toggle:hover:not(:disabled) {
          background-color: #f3f4f6;
        }

        .password-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-extras {
          display: flex;
          justify-content: flex-end;
          margin: -0.5rem 0 0.5rem;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #4f46e5;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .forgot-password-link:hover {
          color: #3730a3;
        }

        .auth-link {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .auth-link p {
          color: #6b7280;
          margin: 0;
        }

        .link {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .link:hover {
          color: #3730a3;
          text-decoration: underline;
        }

        .auth-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          max-width: 800px;
          width: 100%;
        }

        .info-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .info-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .info-card p {
          color: #6b7280;
          line-height: 1.5;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .auth-container {
            padding: 1rem;
          }

          .auth-card {
            max-width: 100%;
          }

          .auth-header,
          .auth-body {
            padding: 1.5rem;
          }

          .auth-info {
            grid-template-columns: 1fr;
          }

          .info-card {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .auth-header h2 {
            font-size: 1.5rem;
          }

          .auth-header p {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
