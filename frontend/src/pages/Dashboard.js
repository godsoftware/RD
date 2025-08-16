import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { enhancedPredictionService } from '../services/enhancedPredictionService';
import MedicalImageUpload from '../components/MedicalImageUpload';
import MedicalResultCard from '../components/MedicalResultCard';
import PatientHistory from '../components/PatientHistory';

/**
 * Dashboard page component - Main user interface for predictions
 * Features: Prediction form, results display, history, statistics
 */
const Dashboard = () => {
  const { user } = useAuth();
  
  // State management
  const [currentResult, setCurrentResult] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');

  /**
   * Load user statistics on component mount
   */
  useEffect(() => {
    loadStatistics();
    if (activeTab === 'history') {
      loadPredictionHistory();
    }
  }, [activeTab]);

  /**
   * Load user statistics
   */
  const loadStatistics = async () => {
    try {
      console.log('📊 Dashboard loadStatistics called');
      const stats = await enhancedPredictionService.getEnhancedPredictionStats();
      console.log('📥 Dashboard received stats:', stats);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Don't show error toast for stats - it's not critical
    }
  };

  /**
   * Load prediction history with pagination
   */
  const loadPredictionHistory = async (page = 1, status = null) => {
    setIsLoading(true);
    
    try {
      console.log('📋 Dashboard loadPredictionHistory called');
      const filterStatus = status === 'all' ? null : status;
      const data = await enhancedPredictionService.getEnhancedPredictionHistory(page, 10, { status: filterStatus });
      
      console.log('📥 Dashboard received history data:', data);
      
      // Handle different response formats
      const predictions = data.predictions || data.data?.predictions || [];
      const paginationInfo = data.pagination || data.data?.pagination || null;
      
      setPredictionHistory(predictions);
      setHistoryPagination(paginationInfo);
      setHistoryPage(page);
    } catch (error) {
      console.error('Failed to load prediction history:', error);
      toast.error('Failed to load prediction history');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful prediction completion
   */
  const handlePredictionComplete = (result) => {
    console.log('🎯 Dashboard - handlePredictionComplete called');
    console.log('🎯 Dashboard - Result:', result);
    console.log('🎯 Dashboard - Result type:', typeof result);
    
    if (result) {
      console.log('✅ Dashboard - Setting current result and switching to result tab');
      setCurrentResult(result);
      setActiveTab('result');
      
      // Refresh statistics
      loadStatistics();
      
      // If history is loaded, refresh it to include the new prediction
      if (predictionHistory.length > 0) {
        loadPredictionHistory(1, historyFilter);
      }
    } else {
      console.log('❌ Dashboard - No result received');
    }
  };

  /**
   * Handle prediction start (loading state)
   */
  const handlePredictionStart = () => {
    setCurrentResult(null);
  };

  /**
   * Handle prediction deletion from history
   */
  const handlePredictionDelete = (predictionId) => {
    setPredictionHistory(prev => 
      prev.filter(prediction => prediction._id !== predictionId)
    );
    
    // Refresh statistics
    loadStatistics();
    
    // If current result matches deleted prediction, clear it
    if (currentResult && currentResult.prediction && currentResult.prediction._id === predictionId) {
      setCurrentResult(null);
    }
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'history' && predictionHistory.length === 0) {
      loadPredictionHistory(1, historyFilter);
    }
  };

  /**
   * Handle history filter change
   */
  const handleHistoryFilterChange = (filter) => {
    setHistoryFilter(filter);
    loadPredictionHistory(1, filter);
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page) => {
    loadPredictionHistory(page, historyFilter);
  };

  return (
    <div className="dashboard-container">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>🏥 Welcome back, Dr. {user?.username}!</h1>
            <p className="dashboard-subtitle">
              Ready to analyze medical images with AI? Upload X-rays, CT scans, MRIs, or Ultrasound images for automated analysis.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card medical-stat">
              <div className="stat-icon">🩺</div>
              <div className="stat-value">{statistics?.totalPredictions || 0}</div>
              <div className="stat-label">Images Analyzed</div>
            </div>
            <div className="stat-card medical-stat">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{statistics?.avgConfidence ? `${statistics.avgConfidence}%` : '-%'}</div>
              <div className="stat-label">Avg Confidence</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'predict' ? 'active' : ''}`}
            onClick={() => handleTabChange('predict')}
          >
            <span className="tab-icon">🏥</span>
            Analyze Image
          </button>
          <button
            className={`tab-button ${activeTab === 'result' ? 'active' : ''}`}
            onClick={() => handleTabChange('result')}
            disabled={!currentResult}
          >
            <span className="tab-icon">📋</span>
            Latest Analysis
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <span className="tab-icon">📚</span>
            Patient History
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Medical Analysis Tab */}
          {activeTab === 'predict' && (
            <div className="predict-tab">
              <MedicalImageUpload
                onAnalysisComplete={handlePredictionComplete}
                onAnalysisStart={handlePredictionStart}
              />
            </div>
          )}

          {/* Analysis Result Tab */}
          {activeTab === 'result' && (
            <div className="result-tab">
              {currentResult ? (
                <MedicalResultCard
                  result={currentResult}
                  prediction={currentResult}
                  onDelete={handlePredictionDelete}
                  showActions={true}
                  compact={false}
                />
              ) : (
                <div className="empty-state medical-empty">
                  <div className="empty-icon">🏥</div>
                  <h3>No Recent Analysis</h3>
                  <p>Upload and analyze a medical image to see results here.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleTabChange('predict')}
                  >
                    Analyze Medical Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <PatientHistory />
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .dashboard-container {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
        }

        .dashboard-header {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .dashboard-subtitle {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0;
        }

        .quick-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 120px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .medical-stat {
          border-left: 4px solid #3b82f6;
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .medical-empty {
          border-left: 4px solid #3b82f6;
        }

        .medical-empty .empty-icon {
          color: #3b82f6;
        }

        .dashboard-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 2rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.75rem;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .tab-button.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-button:hover:not(:disabled):not(.active) {
          background: rgba(255, 255, 255, 0.5);
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-content {
          min-height: 400px;
        }

        .history-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-label {
          font-weight: 500;
          color: #374151;
        }

        .filter-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          font-size: 0.9rem;
        }

        .filter-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .loading-state .spinner {
          width: 40px;
          height: 40px;
          border-width: 4px;
          margin-bottom: 1rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 2rem;
          max-width: 400px;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0;
        }

        .pagination-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #4f46e5;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-header {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .quick-stats {
            justify-content: center;
            flex-wrap: wrap;
          }

          .stat-card {
            min-width: 100px;
            padding: 1rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .dashboard-tabs {
            flex-direction: column;
            gap: 0;
          }

          .tab-button {
            padding: 0.75rem;
          }

          .history-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .filter-group {
            justify-content: center;
          }

          .pagination {
            flex-direction: column;
            gap: 1rem;
          }

          .pagination-info {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 1rem 0;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .quick-stats {
            grid-template-columns: 1fr 1fr;
          }

          .stat-card {
            padding: 0.75rem;
          }

          .empty-state {
            padding: 3rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
