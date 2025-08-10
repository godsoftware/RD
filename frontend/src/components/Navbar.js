import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * Navbar component - Main navigation bar with responsive design
 * Features: Logo, navigation links, user menu, mobile hamburger menu
 */
const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  /**
   * Check if current route is active
   * @param {string} path - Path to check
   * @returns {boolean} Whether the path is active
   */
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Toggle user dropdown menu
   */
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-brand">
            <Link to="/" className="brand-link">
              <div className="brand-icon">
                🧠
              </div>
              <span className="brand-text">RD Prediction</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            <Link 
              to="/" 
              className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                
                {/* User Menu */}
                <div className="user-menu">
                  <button 
                    onClick={toggleUserMenu}
                    className="user-menu-button"
                  >
                    <div className="user-avatar">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="user-name">{user?.username}</span>
                    <svg 
                      className={`dropdown-icon ${isUserMenuOpen ? 'rotated' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <p className="user-email">{user?.email}</p>
                        <p className="user-role">Role: {user?.role}</p>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item logout-btn"
                      >
                        <svg className="dropdown-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActivePath('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`btn btn-primary nav-cta`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg 
              className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mobile-nav">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActivePath('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`mobile-nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="mobile-user-info">
                  <p className="mobile-username">{user?.username}</p>
                  <p className="mobile-email">{user?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="mobile-nav-button logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`mobile-nav-link ${isActivePath('/login') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="mobile-nav-button btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .navbar-brand .brand-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: #1f2937;
          font-weight: 600;
          font-size: 1.25rem;
        }

        .brand-icon {
          font-size: 1.5rem;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #4f46e5;
        }

        .nav-cta {
          margin-left: 1rem;
        }

        .user-menu {
          position: relative;
        }

        .user-menu-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }

        .user-menu-button:hover {
          background-color: #f3f4f6;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-name {
          font-weight: 500;
          color: #374151;
        }

        .dropdown-icon {
          width: 16px;
          height: 16px;
          transition: transform 0.2s;
        }

        .dropdown-icon.rotated {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          min-width: 200px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 60;
        }

        .dropdown-header {
          padding: 1rem;
        }

        .user-email {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .user-role {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .dropdown-divider {
          border-top: 1px solid #e5e7eb;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover {
          background-color: #f3f4f6;
        }

        .dropdown-item-icon {
          width: 16px;
          height: 16px;
        }

        .logout-btn {
          color: #ef4444;
        }

        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .hamburger {
          width: 24px;
          height: 24px;
        }

        .mobile-nav {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
        }

        .mobile-nav-link,
        .mobile-nav-button {
          display: block;
          padding: 0.75rem 1.5rem;
          color: #374151;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .mobile-nav-link:hover,
        .mobile-nav-button:hover {
          background-color: #f3f4f6;
        }

        .mobile-nav-link.active {
          color: #4f46e5;
          background-color: #f3f4f6;
        }

        .mobile-user-info {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          margin: 0.5rem 0;
        }

        .mobile-username {
          font-weight: 500;
          color: #374151;
        }

        .mobile-email {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }

          .mobile-nav {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
