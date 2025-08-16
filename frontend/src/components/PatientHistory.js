import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { enhancedPredictionService } from '../services/enhancedPredictionService';
import MedicalResultCard from './MedicalResultCard';

/**
 * PatientHistory component - Display analysis history in folder-like structure
 */
const PatientHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [currentPage, filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 PatientHistory loadHistory called');
      const filterStatus = filter === 'all' ? null : filter;
      const data = await enhancedPredictionService.getEnhancedPredictionHistory(
        currentPage, 
        10, 
        { status: filterStatus }
      );
      
      console.log('📥 PatientHistory received data:', data);
      
      // Handle different response formats
      const predictions = data.predictions || data.data?.predictions || [];
      const paginationInfo = data.pagination || data.data?.pagination || null;
      
      // Debug: Check what data we have for MedicalResultCard
      console.log('📋 Predictions to display:', predictions);
      if (predictions.length > 0) {
        console.log('🔍 First prediction details for MedicalResultCard:');
        const firstPred = predictions[0];
        console.log('  - geminiInterpretation:', firstPred.geminiInterpretation ? 'EXISTS' : 'MISSING');
        console.log('  - diseaseInfo:', firstPred.diseaseInfo ? 'EXISTS' : 'MISSING'); 
        console.log('  - result.geminiInterpretation:', firstPred.result?.geminiInterpretation ? 'EXISTS' : 'MISSING');
        console.log('  - result.diseaseInfo:', firstPred.result?.diseaseInfo ? 'EXISTS' : 'MISSING');
        console.log('  - processingTime:', firstPred.processingTime || firstPred.result?.processingTime || 'MISSING');
        console.log('  - Full structure keys:', Object.keys(firstPred));
        if (firstPred.result) {
          console.log('  - Result structure keys:', Object.keys(firstPred.result));
        }
      }
      
      // Group by date
      const grouped = groupByDate(predictions);
      setHistoryData(grouped);
      setPagination(paginationInfo);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setIsLoading(false);
    }
  };

  const groupByDate = (predictions) => {
    const groups = {};
    
    predictions.forEach(pred => {
      try {
        const date = new Date(pred.createdAt);
        const dateKey = date.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        
        // Ensure prediction has ALL required fields for MedicalResultCard  
        const enhancedPred = {
          ...pred,
          _id: pred._id || pred.id,
          id: pred.id || pred._id,
          
          // Basic prediction data
          confidence: pred.confidence || pred.result?.confidence || 0,
          modelType: pred.modelType || pred.result?.modelType || 'unknown', 
          prediction: pred.prediction || pred.result?.prediction || 'Unknown',
          
          // Enhanced analysis data - KEY FIELDS for complete display
          geminiInterpretation: pred.geminiInterpretation || pred.result?.geminiInterpretation || null,
          diseaseInfo: pred.diseaseInfo || pred.result?.diseaseInfo || null,
          processingTime: pred.processingTime || pred.result?.processingTime || null,
          
          // Medical analysis data
          medicalAnalysis: pred.medicalAnalysis || {
            imageType: pred.imageType || pred.result?.imageType || 'Medical Image',
            analysisType: pred.analysisType || pred.result?.analysisType || 'Diagnosis',
            findings: pred.findings || pred.result?.findings || [],
            recommendations: pred.recommendations || pred.result?.recommendations || []
          },
          
          // Patient information
          patientInfo: pred.patientInfo || pred.patient || null,
          
          // Image information  
          imageInfo: pred.imageInfo || pred.image || null,
          
          // Timestamps
          createdAt: pred.createdAt || pred.created_at || pred.timestamp,
          completedAt: pred.completedAt || pred.completed_at || null,
          
          // Status
          status: pred.status || 'completed'
        };
        
        groups[dateKey].push(enhancedPred);
      } catch (error) {
        console.warn('Error processing prediction date:', error, pred);
      }
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      items,
      id: date
    }));
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleDelete = async (predictionId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await enhancedPredictionService.deletePrediction(predictionId);
      toast.success('Analysis deleted successfully');
      loadHistory();
    } catch (error) {
      toast.error('Failed to delete analysis');
    }
  };

  const getModelIcon = (modelType) => {
    const icons = {
      pneumonia: '🫁',
      brainTumor: '🧠',
      tuberculosis: '🦠',
      default: '🏥'
    };
    return icons[modelType] || icons.default;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: '#10b981', text: 'Completed' },
      pending: { color: '#f59e0b', text: 'Pending' },
      failed: { color: '#ef4444', text: 'Failed' }
    };
    const badge = badges[status] || badges.completed;
    
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '500',
        backgroundColor: badge.color + '20',
        color: badge.color
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="patient-history">
      {/* Controls */}
      <div className="history-controls">
        <div className="control-group">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Analyses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="type">Sort by Type</option>
            <option value="confidence">Sort by Confidence</option>
          </select>
        </div>
        
        <button
          onClick={loadHistory}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analysis history...</p>
        </div>
      ) : historyData.length > 0 ? (
        <div className="history-folders">
          {historyData.map(group => (
            <div key={group.id} className="date-group">
              <div 
                className="date-header"
                onClick={() => toggleExpanded(group.id)}
              >
                <div className="header-left">
                  <span className="folder-icon">
                    {expandedItems[group.id] ? '📂' : '📁'}
                  </span>
                  <span className="date-text">{group.date}</span>
                  <span className="count-badge">{group.items.length} analyses</span>
                </div>
                <span className="expand-icon">
                  {expandedItems[group.id] ? '▼' : '▶'}
                </span>
              </div>
              
              {expandedItems[group.id] && (
                <div className="date-items">
                  {group.items.map(item => (
                    <div key={item._id} className="history-item">
                      <div 
                        className="item-summary"
                        onClick={() => toggleExpanded(item._id)}
                      >
                        <div className="item-left">
                          <span className="model-icon">
                            {getModelIcon(item.modelType)}
                          </span>
                          <div className="item-info">
                            <div className="item-title">
                              {item.modelType === 'pneumonia' && 'Pneumonia Analysis'}
                              {item.modelType === 'brainTumor' && 'Brain Tumor Analysis'}
                              {item.modelType === 'tuberculosis' && 'Tuberculosis Analysis'}
                              {!item.modelType && 'Medical Analysis'}
                            </div>
                            <div className="item-meta">
                              <span className="time">
                                {new Date(item.createdAt).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="prediction-result">
                                Result: {item.prediction || 'Unknown'}
                              </span>
                              <span className="confidence">
                                Confidence: {item.confidence 
                                  ? (typeof item.confidence === 'number' 
                                    ? `${Math.min(item.confidence * 100, 100).toFixed(1)}%` 
                                    : item.confidence)
                                  : 'N/A'}
                              </span>
                              {item.geminiInterpretation && (
                                <span className="has-ai-analysis">🤖 AI Analysis</span>
                              )}
                              {item.diseaseInfo && (
                                <span className="has-disease-info">ℹ️ Disease Info</span>
                              )}
                              {getStatusBadge(item.status || 'completed')}
                            </div>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(item._id);
                            }}
                          >
                            {expandedItems[item._id] ? '📋' : '👁️'}
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item._id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {expandedItems[item._id] && (
                        <div className="item-details">
                          <MedicalResultCard
                            prediction={item}
                            result={item}
                            onDelete={() => handleDelete(item._id)}
                            showActions={false}
                            compact={false}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Analysis History</h3>
          <p>Your medical image analyses will appear here.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      <style jsx="true">{`
        .patient-history {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          min-height: 500px;
        }

        .history-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .control-group {
          display: flex;
          gap: 1rem;
        }

        .filter-select,
        .sort-select {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
        }

        .history-folders {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .date-group {
          background: #f9fafb;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .date-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .date-header:hover {
          background: linear-gradient(135deg, #4338ca, #6d28d9);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .folder-icon {
          font-size: 1.5rem;
        }

        .date-text {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .count-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
        }

        .expand-icon {
          font-size: 0.875rem;
          transition: transform 0.2s;
        }

        .date-items {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .history-item {
          background: white;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .item-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .item-summary:hover {
          background: #f8fafc;
        }

        .item-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .model-icon {
          font-size: 2rem;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .item-title {
          font-weight: 600;
          color: #1f2937;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem;
          background: #f3f4f6;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #e5e7eb;
        }

        .action-btn.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-details {
          padding: 1rem;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 4px solid #e5e7eb;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .prediction-result {
          font-weight: 600;
          color: #2563eb;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 8px;
        }
        
        .has-ai-analysis {
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        
        .has-disease-info {
          background: linear-gradient(135deg, #34a853, #fbbc04);
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        @media (max-width: 768px) {
          .patient-history {
            padding: 1rem;
          }

          .control-group {
            flex-direction: column;
            width: 100%;
          }

          .filter-select,
          .sort-select {
            width: 100%;
          }

          .history-controls {
            flex-direction: column;
            gap: 1rem;
          }

          .item-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientHistory;
