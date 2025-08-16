import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { enhancedPredictionService } from '../services/enhancedPredictionService';

/**
 * Profile page component - User profile management and settings
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    displayName: user?.displayName || '',
    phone: '',
    specialization: '',
    hospital: '',
    experience: '',
    bio: ''
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    darkMode: false,
    language: 'tr'
  });

  useEffect(() => {
    loadStatistics();
    loadUserProfile();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await enhancedPredictionService.getEnhancedPredictionStats();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Load user profile from backend if available
      const profile = await enhancedAuthService.getProfile();
      if (profile) {
        setProfileData(prev => ({
          ...prev,
          ...profile
        }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await enhancedAuthService.updateProfile({
        username: profileData.username,
        displayName: profileData.displayName,
        phone: profileData.phone,
        specialization: profileData.specialization,
        hospital: profileData.hospital,
        experience: profileData.experience,
        bio: profileData.bio
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    setIsLoading(true);

    try {
      // Save settings to localStorage for now
      localStorage.setItem('userSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!window.confirm('Send password reset email to ' + user?.email + '?')) {
      return;
    }

    try {
      await enhancedAuthService.sendPasswordReset(user?.email);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('This will permanently delete all your data including analysis history. Continue?')) {
      return;
    }

    try {
      await enhancedAuthService.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="profile-container">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user?.username?.charAt(0)?.toUpperCase() || '👤'}
            </div>
          </div>
          <div className="profile-info">
            <h1>Dr. {user?.username || 'User'}</h1>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-badges">
              <span className="badge">🏥 Medical Professional</span>
              <span className="badge">✅ Verified Account</span>
              {statistics?.totalPredictions > 100 && (
                <span className="badge gold">🏆 Expert Analyst</span>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
            >
              {isEditing ? '✖ Cancel' : '✏️ Edit Profile'}
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{statistics?.totalPredictions || 0}</div>
              <div className="stat-label">Total Analyses</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{statistics?.avgConfidence || 0}%</div>
              <div className="stat-label">Avg Confidence</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{statistics?.thisMonth || 0}</div>
              <div className="stat-label">This Month</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{statistics?.successRate || 0}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            👤 Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📈 Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="info-tab">
              <form onSubmit={handleProfileUpdate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="form-input"
                    />
                    <small>Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Dr. John Doe"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+90 555 123 4567"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Specialization</label>
                    <select
                      value={profileData.specialization}
                      onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    >
                      <option value="">Select Specialization</option>
                      <option value="radiology">Radiology</option>
                      <option value="pulmonology">Pulmonology</option>
                      <option value="neurology">Neurology</option>
                      <option value="general">General Medicine</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hospital/Clinic</label>
                    <input
                      type="text"
                      value={profileData.hospital}
                      onChange={(e) => setProfileData({...profileData, hospital: e.target.value})}
                      disabled={!isEditing}
                      placeholder="City Hospital"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      value={profileData.experience}
                      onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                      disabled={!isEditing}
                      placeholder="5"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows="4"
                      className="form-input"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-section">
                <h3>Notifications</h3>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Email Notifications</span>
                      <span className="setting-desc">Receive analysis results via email</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Push Notifications</span>
                      <span className="setting-desc">Browser push notifications</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Weekly Reports</span>
                      <span className="setting-desc">Receive weekly analysis summaries</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.weeklyReports}
                        onChange={(e) => setSettings({...settings, weeklyReports: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Preferences</h3>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Dark Mode</span>
                      <span className="setting-desc">Use dark theme</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Language</span>
                      <span className="setting-desc">Select your preferred language</span>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="setting-select"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleSettingsUpdate}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="security-tab">
              <div className="security-section">
                <h3>Password</h3>
                <p>Keep your account secure with a strong password.</p>
                <button
                  onClick={handlePasswordReset}
                  className="btn btn-secondary"
                >
                  📧 Send Password Reset Email
                </button>
              </div>

              <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account.</p>
                <button className="btn btn-secondary" disabled>
                  🔐 Enable 2FA (Coming Soon)
                </button>
              </div>

              <div className="security-section danger">
                <h3>Danger Zone</h3>
                <p>Irreversible actions that affect your account.</p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                >
                  ⚠️ Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-chart">
                <h3>Analysis Activity</h3>
                <div className="chart-placeholder">
                  <p>📊 Activity chart coming soon...</p>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🫁</span>
                    <div className="activity-details">
                      <span className="activity-title">Pneumonia Analysis</span>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">🧠</span>
                    <div className="activity-details">
                      <span className="activity-title">Brain Tumor Analysis</span>
                      <span className="activity-time">Yesterday</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">🦠</span>
                    <div className="activity-details">
                      <span className="activity-title">Tuberculosis Analysis</span>
                      <span className="activity-time">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .profile-container {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(50%, -50%);
        }

        .profile-avatar {
          flex-shrink: 0;
          position: relative;
        }

        .avatar-placeholder {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: bold;
          border: 4px solid rgba(255,255,255,0.2);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .profile-info {
          flex: 1;
          position: relative;
          z-index: 2;
        }

        .profile-info h1 {
          margin: 0 0 0.75rem 0;
          color: white;
          font-size: 2.25rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .profile-email {
          color: rgba(255,255,255,0.8);
          margin: 0 0 1.5rem 0;
          font-size: 1.1rem;
          font-weight: 400;
        }

        .profile-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .badge {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 2rem;
          font-size: 0.875rem;
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .badge:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        .badge.gold {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
        }

        .profile-actions {
          display: flex;
          gap: 1rem;
          position: relative;
          z-index: 2;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-tabs {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9rem;
          position: relative;
          overflow: hidden;
        }

        .tab-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .tab-btn:hover::before {
          opacity: 1;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }

        .tab-btn.active::before {
          opacity: 0;
        }

        .tab-content {
          background: white;
          padding: 2.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          padding: 1rem 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
        }

        .form-input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .form-group small {
          margin-top: 0.25rem;
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .form-actions {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .settings-section {
          margin-bottom: 2rem;
        }

        .settings-section h3 {
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .setting-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .setting-label {
          font-weight: 500;
          color: #374151;
        }

        .setting-desc {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .setting-select {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          background: white;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #4f46e5;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .security-section {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .security-section.danger {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .security-section h3 {
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .security-section p {
          margin-bottom: 1rem;
          color: #6b7280;
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.5);
        }

        .btn:not(.btn-danger) {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }

        .btn-secondary {
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-2px);
        }

        .activity-chart {
          margin-bottom: 2rem;
        }

        .chart-placeholder {
          height: 200px;
          background: #f9fafb;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .recent-activity h3 {
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .activity-icon {
          font-size: 1.5rem;
        }

        .activity-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .activity-title {
          font-weight: 500;
          color: #374151;
        }

        .activity-time {
          font-size: 0.875rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .profile-actions {
            width: 100%;
            justify-content: center;
          }

          .profile-stats {
            grid-template-columns: 1fr;
          }

          .tab-btn {
            font-size: 0.875rem;
            padding: 0.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
