import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { predictionService } from '../services/predictionService';

/**
 * ResultCard component - Displays prediction results with detailed information
 * Features: Result display, confidence levels, actions (save, delete, share)
 */
const ResultCard = ({ 
  result, 
  prediction, 
  onDelete, 
  showActions = true, 
  compact = false 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // If no result or prediction provided
  if (!result && !prediction) {
    return null;
  }

  // Extract data from either result or prediction object
  const data = result || {
    prediction: prediction?.result?.prediction,
    confidence: prediction?.result?.confidence,
    category: prediction?.result?.category,
    processingTime: prediction?.processingTime,
    createdAt: prediction?.createdAt,
    id: prediction?._id
  };

  /**
   * Handle result deletion
   */
  const handleDelete = async () => {
    if (!data.id) {
      toast.error('Cannot delete: No prediction ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this prediction?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await predictionService.deletePrediction(data.id);
      toast.success('Prediction deleted successfully');
      
      if (onDelete) {
        onDelete(data.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete prediction');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle result sharing
   */
  const handleShare = () => {
    const shareText = `AI Prediction Result:\n` +
      `Prediction: ${data.prediction}\n` +
      `Confidence: ${getConfidencePercentage()}%\n` +
      `Category: ${data.category || 'N/A'}\n` +
      `Processing Time: ${data.processingTime}ms`;

    if (navigator.share) {
      navigator.share({
        title: 'AI Prediction Result',
        text: shareText
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
        .then(() => toast.success('Result copied to clipboard'))
        .catch(() => toast.error('Failed to copy result'));
    }
  };

  /**
   * Get confidence as percentage
   */
  const getConfidencePercentage = () => {
    if (typeof data.confidence === 'string' && data.confidence.includes('%')) {
      return parseFloat(data.confidence);
    }
    return typeof data.confidence === 'number' 
      ? (data.confidence * 100).toFixed(1)
      : 0;
  };

  /**
   * Get confidence level color and description
   */
  const getConfidenceInfo = () => {
    const percentage = getConfidencePercentage();
    
    if (percentage >= 90) return { color: '#10b981', level: 'Very High', icon: '🟢' };
    if (percentage >= 75) return { color: '#f59e0b', level: 'High', icon: '🟡' };
    if (percentage >= 60) return { color: '#ef4444', level: 'Medium', icon: '🟠' };
    if (percentage >= 40) return { color: '#6b7280', level: 'Low', icon: '🔴' };
    return { color: '#9ca3af', level: 'Very Low', icon: '⚪' };
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const confidenceInfo = getConfidenceInfo();

  return (
    <div className={`result-card ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="result-header">
        <div className="result-title">
          <h3>Prediction Result</h3>
          {data.createdAt && (
            <span className="result-date">{formatDate(data.createdAt)}</span>
          )}
        </div>
        
        {showActions && (
          <div className="result-actions">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="action-btn details-btn"
              title="Toggle details"
            >
              {showDetails ? '👁️‍🗨️' : '👁️'}
            </button>
            <button
              onClick={handleShare}
              className="action-btn share-btn"
              title="Share result"
            >
              📤
            </button>
            {data.id && (
              <button
                onClick={handleDelete}
                className="action-btn delete-btn"
                disabled={isDeleting}
                title="Delete prediction"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Result */}
      <div className="result-main">
        <div className="prediction-value">
          <div className="prediction-label">Prediction</div>
          <div className="prediction-number">{data.prediction ?? 'N/A'}</div>
          {data.category && (
            <div className="prediction-category">{data.category}</div>
          )}
        </div>

        <div className="confidence-section">
          <div className="confidence-header">
            <span className="confidence-icon">{confidenceInfo.icon}</span>
            <span className="confidence-label">Confidence</span>
          </div>
          <div className="confidence-bar-container">
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${getConfidencePercentage()}%`,
                  backgroundColor: confidenceInfo.color
                }}
              ></div>
            </div>
            <span className="confidence-text">
              {getConfidencePercentage()}% ({confidenceInfo.level})
            </span>
          </div>
        </div>
      </div>

      {/* Processing Info */}
      {!compact && (
        <div className="result-meta">
          {data.processingTime && (
            <div className="meta-item">
              <span className="meta-label">Processing Time:</span>
              <span className="meta-value">{data.processingTime}ms</span>
            </div>
          )}
          {prediction?.modelVersion && (
            <div className="meta-item">
              <span className="meta-label">Model Version:</span>
              <span className="meta-value">{prediction.modelVersion}</span>
            </div>
          )}
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && prediction && (
        <div className="result-details">
          <div className="details-header">
            <h4>Detailed Information</h4>
          </div>
          
          <div className="details-grid">
            {prediction.inputData && (
              <div className="detail-item">
                <strong>Input Data:</strong>
                <pre className="input-data-preview">
                  {typeof prediction.inputData === 'object' 
                    ? JSON.stringify(prediction.inputData, null, 2)
                    : prediction.inputData}
                </pre>
              </div>
            )}
            
            {prediction.status && (
              <div className="detail-item">
                <strong>Status:</strong>
                <span className={`status-badge ${prediction.status}`}>
                  {prediction.status.toUpperCase()}
                </span>
              </div>
            )}
            
            {prediction.metadata && (
              <div className="detail-item">
                <strong>Metadata:</strong>
                <div className="metadata-list">
                  {prediction.metadata.fileName && (
                    <div>File: {prediction.metadata.fileName}</div>
                  )}
                  {prediction.metadata.fileSize && (
                    <div>Size: {(prediction.metadata.fileSize / 1024).toFixed(1)} KB</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .result-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .result-card.compact {
          margin-bottom: 1rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
        }

        .result-card.compact .result-header {
          padding: 1rem;
        }

        .result-title h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .result-date {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-top: 0.25rem;
          display: block;
        }

        .result-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 1rem;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .result-main {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: center;
        }

        .result-card.compact .result-main {
          padding: 1rem;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .prediction-value {
          text-align: center;
        }

        .prediction-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .prediction-number {
          font-size: 3rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .result-card.compact .prediction-number {
          font-size: 2rem;
        }

        .prediction-category {
          font-size: 1rem;
          color: #4f46e5;
          font-weight: 500;
        }

        .confidence-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .confidence-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .confidence-icon {
          font-size: 1.25rem;
        }

        .confidence-bar-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .confidence-bar {
          height: 0.75rem;
          background-color: #e5e7eb;
          border-radius: 0.375rem;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          transition: width 0.3s ease-in-out;
          border-radius: 0.375rem;
        }

        .confidence-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .result-meta {
          padding: 1rem 1.5rem;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .result-card.compact .result-meta {
          padding: 0.75rem 1rem;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .meta-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .result-details {
          border-top: 1px solid #e5e7eb;
        }

        .details-header {
          padding: 1rem 1.5rem;
          background-color: #f3f4f6;
        }

        .details-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #374151;
        }

        .details-grid {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-item strong {
          color: #374151;
          font-size: 0.875rem;
        }

        .input-data-preview {
          background-color: #f3f4f6;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.completed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.failed {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .metadata-list {
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        @media (max-width: 768px) {
          .result-main {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .result-header {
            padding: 1rem;
          }

          .result-actions {
            gap: 0.25rem;
          }

          .action-btn {
            padding: 0.375rem;
            font-size: 0.875rem;
          }

          .prediction-number {
            font-size: 2.5rem;
          }

          .result-meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .details-grid {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultCard;
