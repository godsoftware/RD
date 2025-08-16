import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { enhancedAuthService } from '../services/enhancedAuthService';

/**
 * Register page component - User registration form
 * Features: Username/email/password registration, form validation, loading states, error handling
 */
const Register = () => {
  const navigate = useNavigate();
  const { login, startLogin, loginFailure, clearError, error, loading } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Clear any existing errors on component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear field-specific validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear confirm password error if passwords now match
    if (name === 'password' && formData.confirmPassword && value === formData.confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: null
      }));
    }

    if (name === 'confirmPassword' && formData.password && value === formData.password) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: null
      }));
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      errors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const { user, token } = await enhancedAuthService.register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      login(user, token);
      toast.success(`Welcome to RD Predictions, ${user.username}!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      loginFailure(error.message || 'Registration failed');
      
      // Handle specific error messages
      if (error.message.includes('already exists')) {
        toast.error('User with this email or username already exists');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  /**
   * Get password strength info
   */
  const getPasswordStrengthInfo = () => {
    const levels = [
      { label: 'Very Weak', color: '#ef4444', width: '16.67%' },
      { label: 'Weak', color: '#f97316', width: '33.33%' },
      { label: 'Fair', color: '#f59e0b', width: '50%' },
      { label: 'Good', color: '#eab308', width: '66.67%' },
      { label: 'Strong', color: '#22c55e', width: '83.33%' },
      { label: 'Very Strong', color: '#10b981', width: '100%' }
    ];
    
    return levels[passwordStrength] || levels[0];
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join thousands of users making AI-powered predictions</p>
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
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${validationErrors.username ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                disabled={loading}
                autoComplete="username"
                required
              />
              {validationErrors.username && (
                <div className="form-error">{validationErrors.username}</div>
              )}
              <div className="form-hint">
                3-30 characters, letters, numbers, and underscores only
              </div>
            </div>

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
                  placeholder="Create a strong password"
                  disabled={loading}
                  autoComplete="new-password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: strengthInfo.width,
                        backgroundColor: strengthInfo.color 
                      }}
                    ></div>
                  </div>
                  <span className="strength-label">{strengthInfo.label}</span>
                </div>
              )}
              
              {validationErrors.password && (
                <div className="form-error">{validationErrors.password}</div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div className="form-error">{validationErrors.confirmPassword}</div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="terms-agreement">
              <p>
                By creating an account, you agree to our{' '}
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => toast.info('Terms of Service coming soon')}
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => toast.info('Privacy Policy coming soon')}
                >
                  Privacy Policy
                </button>
              </p>
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="auth-link">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h3>Why join RD Predictions?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">⚡</div>
            <div>
              <h4>Instant Predictions</h4>
              <p>Get AI-powered results in milliseconds</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">📊</div>
            <div>
              <h4>Detailed Analytics</h4>
              <p>Track your prediction history and insights</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">🔒</div>
            <div>
              <h4>Secure & Private</h4>
              <p>Your data is encrypted and protected</p>
            </div>
          </div>
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
          max-width: 450px;
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
          gap: 1.25rem;
        }

        .form-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
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

        .password-strength {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .strength-label {
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .terms-agreement {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        .terms-agreement p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .link-button {
          background: none;
          border: none;
          color: #4f46e5;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
        }

        .link-button:hover {
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

        .benefits-section {
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .benefits-section h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-align: left;
        }

        .benefit-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .benefit-item h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .benefit-item p {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
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

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .benefit-item {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .auth-header h2 {
            font-size: 1.5rem;
          }

          .auth-header p {
            font-size: 0.9rem;
          }

          .benefit-item {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
