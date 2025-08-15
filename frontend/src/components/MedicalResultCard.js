import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { predictionService } from '../services/predictionService';

/**
 * MedicalResultCard component - Displays medical image analysis results
 * Features: Medical findings, confidence levels, recommendations, DICOM info
 */
const MedicalResultCard = ({ 
  result, 
  prediction, 
  onDelete, 
  showActions = true, 
  compact = false 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('findings');

  // If no result or prediction provided
  if (!result && !prediction) {
    return null;
  }

  // Extract data from either result or prediction object
  console.log('🎯 MedicalResultCard - result prop:', result);
  console.log('🎯 MedicalResultCard - prediction prop:', prediction);
  
  const data = result || prediction || {
    prediction: prediction?.prediction || result?.prediction,
    confidence: prediction?.confidence || result?.confidence,
    category: prediction?.category || result?.category,
    processingTime: prediction?.processingTime || result?.processingTime,
    createdAt: prediction?.createdAt,
    id: prediction?._id
  };

  const medicalData = result?.medicalAnalysis || {};

  /**
   * Handle result deletion
   */
  const handleDelete = async () => {
    if (!data.id) {
      toast.error('Cannot delete: No analysis ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this medical analysis?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await predictionService.deletePrediction(data.id);
      toast.success('Medical analysis deleted successfully');
      
      if (onDelete) {
        onDelete(data.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete analysis');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle result sharing
   */
  const handleShare = () => {
    const shareText = `Medical Image Analysis Result:\n` +
      `Image Type: ${medicalData.imageType || 'Unknown'}\n` +
      `Analysis: ${medicalData.analysisType || 'General'}\n` +
      `Confidence: ${getConfidencePercentage()}%\n` +
      `Key Findings: ${medicalData.findings?.slice(0, 2).join(', ') || 'See detailed report'}\n` +
      `Processing Time: ${data.processingTime}ms`;

    if (navigator.share) {
      navigator.share({
        title: 'Medical Analysis Result',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => toast.success('Medical report copied to clipboard'))
        .catch(() => toast.error('Failed to copy report'));
    }
  };

  /**
   * Generate medical report
   */
  const generateReport = () => {
    const reportData = {
      timestamp: new Date().toLocaleString(),
      imageType: medicalData.imageType,
      analysisType: medicalData.analysisType,
      confidence: getConfidencePercentage(),
      findings: medicalData.findings,
      recommendations: medicalData.recommendations
    };

    const reportText = `
MEDICAL IMAGE ANALYSIS REPORT
Generated: ${reportData.timestamp}

IMAGE INFORMATION:
- Type: ${reportData.imageType || 'N/A'}
- Analysis: ${reportData.analysisType || 'N/A'}
- Confidence: ${reportData.confidence}%

FINDINGS:
${reportData.findings?.map(f => `- ${f}`).join('\n') || 'No specific findings noted'}

RECOMMENDATIONS:
${reportData.recommendations?.map(r => `- ${r}`).join('\n') || 'No specific recommendations'}

NOTE: This is an AI-assisted analysis and should be reviewed by a qualified radiologist.
    `;

    // Download as text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Medical report downloaded');
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
    
    if (percentage >= 90) return { color: '#10b981', level: 'Very High', icon: '🟢', status: 'Highly Confident' };
    if (percentage >= 75) return { color: '#f59e0b', level: 'High', icon: '🟡', status: 'Confident' };
    if (percentage >= 60) return { color: '#ef4444', level: 'Moderate', icon: '🟠', status: 'Moderate Confidence' };
    if (percentage >= 40) return { color: '#6b7280', level: 'Low', icon: '🔴', status: 'Low Confidence' };
    return { color: '#9ca3af', level: 'Very Low', icon: '⚪', status: 'Requires Review' };
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

  console.log('🎯 MedicalResultCard - Final data object:', data);
  console.log('🎯 MedicalResultCard - Medical data:', medicalData);
  
  return (
    <div className={`medical-result-card ${compact ? 'compact' : ''}`}>
      {/* Debug Info */}
      <div style={{
        background: '#f0f0f0',
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>🔍 MedicalResultCard Debug:</strong><br/>
        Data exists: {data ? 'YES' : 'NO'}<br/>
        Prediction: {data?.prediction || 'N/A'}<br/>
        Confidence: {data?.confidence || 'N/A'}%<br/>
        Model Type: {data?.modelType || 'N/A'}<br/>
        Medical Analysis: {medicalData ? 'YES' : 'NO'}<br/>
        Gemini AI: {data?.geminiInterpretation ? 'YES' : 'NO'}<br/>
        Disease Info: {data?.diseaseInfo ? 'YES' : 'NO'}<br/>
      </div>
      
      {/* Header */}
      <div className="medical-result-header">
        <div className="result-title">
          <h3>
            {medicalData.imageType ? `${medicalData.imageType} Analysis` : 'Medical Analysis'}
          </h3>
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
              {showDetails ? '📋' : '📊'}
            </button>
            <button
              onClick={generateReport}
              className="action-btn report-btn"
              title="Generate report"
            >
              📄
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
                title="Delete analysis"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Result */}
      <div className="medical-result-main">
        <div className="analysis-summary">
          <div className="analysis-type">
            <div className="analysis-label">Analysis Type</div>
            <div className="analysis-value">{medicalData.analysisType || 'General Analysis'}</div>
          </div>

          <div className="confidence-section">
            <div className="confidence-header">
              <span className="confidence-icon">{confidenceInfo.icon}</span>
              <span className="confidence-label">AI Confidence</span>
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
              <div className="confidence-info">
                <span className="confidence-percentage">{getConfidencePercentage()}%</span>
                <span className="confidence-status">{confidenceInfo.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gemini AI Interpretation */}
        {data?.geminiInterpretation && (
          <div className="gemini-section" style={{
            background: 'linear-gradient(135deg, #f8f9ff, #e8f0fe)',
            border: '2px solid #4285f4',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px'
          }}>
            <div className="section-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#4285f4'
            }}>
              <span>🤖</span>
              <span>Gemini AI Gelişmiş Değerlendirme</span>
            </div>
            <div className="gemini-content" style={{
              lineHeight: '1.6',
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}>
              {data.geminiInterpretation}
            </div>
          </div>
        )}

        {/* Disease Info */}
        {data?.diseaseInfo && (
          <div className="disease-info-section" style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e6f7ff)',
            border: '2px solid #34a853',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px'
          }}>
            <div className="section-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#34a853'
            }}>
              <span>ℹ️</span>
              <span>Hastalık Bilgileri</span>
            </div>
            <div className="disease-info-content" style={{
              lineHeight: '1.6',
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}>
              {data.diseaseInfo}
            </div>
          </div>
        )}

        {/* Quick Findings */}
        {!compact && medicalData.findings && (
          <div className="quick-findings">
            <h4>Key Findings:</h4>
            <ul>
              {medicalData.findings.slice(0, 3).map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
          </div>
        )}
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
              <span className="meta-label">AI Model Version:</span>
              <span className="meta-value">{prediction.modelVersion}</span>
            </div>
          )}
        </div>
      )}

      {/* Detailed Medical Information */}
      {showDetails && (
        <div className="medical-details">
          <div className="details-tabs">
            <button
              className={`tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
              onClick={() => setActiveTab('findings')}
            >
              🔍 Findings
            </button>
            <button
              className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              💡 Recommendations
            </button>
            <button
              className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              ⚙️ Technical
            </button>
          </div>

          <div className="details-content">
            {activeTab === 'findings' && (
              <div className="findings-tab">
                <h4>Detailed Findings</h4>
                {medicalData.findings ? (
                  <ul className="findings-list">
                    {medicalData.findings.map((finding, index) => (
                      <li key={index} className="finding-item">
                        <span className="finding-icon">•</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No specific findings available</p>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="recommendations-tab">
                <h4>Clinical Recommendations</h4>
                {medicalData.recommendations ? (
                  <ul className="recommendations-list">
                    {medicalData.recommendations.map((rec, index) => (
                      <li key={index} className="recommendation-item">
                        <span className="rec-icon">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No specific recommendations available</p>
                )}
                
                <div className="disclaimer">
                  <strong>⚠️ Disclaimer:</strong> This AI analysis is for assistance only. 
                  All results should be reviewed and interpreted by a qualified radiologist 
                  or medical professional.
                </div>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="technical-tab">
                <h4>Technical Details</h4>
                <div className="technical-grid">
                  {prediction?.inputData && (
                    <div className="tech-item">
                      <strong>Input Parameters:</strong>
                      <pre className="tech-data">
                        {typeof prediction.inputData === 'object' 
                          ? JSON.stringify(prediction.inputData, null, 2)
                          : prediction.inputData}
                      </pre>
                    </div>
                  )}
                  
                  {prediction?.metadata && (
                    <div className="tech-item">
                      <strong>File Metadata:</strong>
                      <div className="metadata-grid">
                        {prediction.metadata.fileName && (
                          <div>File: {prediction.metadata.fileName}</div>
                        )}
                        {prediction.metadata.fileSize && (
                          <div>Size: {(prediction.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .medical-result-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 1.5rem;
          border-left: 4px solid #3b82f6;
        }

        .medical-result-card.compact {
          margin-bottom: 1rem;
        }

        .medical-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
        }

        .medical-result-card.compact .medical-result-header {
          padding: 1rem;
        }

        .result-title h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-title h3::before {
          content: "🏥";
          font-size: 1.1rem;
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

        .medical-result-main {
          padding: 1.5rem;
        }

        .medical-result-card.compact .medical-result-main {
          padding: 1rem;
        }

        .analysis-summary {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .medical-result-card.compact .analysis-summary {
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .analysis-type {
          text-align: center;
        }

        .analysis-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .analysis-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
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

        .confidence-bar-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .confidence-bar {
          height: 1rem;
          background-color: #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          transition: width 0.3s ease-in-out;
          border-radius: 0.5rem;
        }

        .confidence-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .confidence-percentage {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .confidence-status {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .quick-findings {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 0.75rem;
          border-left: 4px solid #10b981;
        }

        .quick-findings h4 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 1rem;
        }

        .quick-findings ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .quick-findings li {
          padding: 0.5rem 0;
          color: #374151;
          position: relative;
          padding-left: 1.5rem;
        }

        .quick-findings li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        .result-meta {
          padding: 1rem 1.5rem;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
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

        .medical-details {
          border-top: 1px solid #e5e7eb;
        }

        .details-tabs {
          display: flex;
          background: #f3f4f6;
        }

        .tab-btn {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: white;
          color: #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.5);
        }

        .details-content {
          padding: 1.5rem;
        }

        .findings-list,
        .recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .finding-item,
        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .finding-icon {
          color: #10b981;
          font-weight: bold;
          flex-shrink: 0;
        }

        .rec-icon {
          color: #3b82f6;
          font-weight: bold;
          flex-shrink: 0;
        }

        .disclaimer {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: #92400e;
        }

        .no-data {
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 2rem;
        }

        .technical-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tech-item strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .tech-data {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .analysis-summary {
            grid-template-columns: 1fr;
          }

          .medical-result-header {
            padding: 1rem;
          }

          .result-actions {
            gap: 0.25rem;
          }

          .action-btn {
            padding: 0.375rem;
            font-size: 0.875rem;
          }

          .details-tabs {
            flex-direction: column;
          }

          .tab-btn {
            padding: 0.75rem;
            text-align: center;
          }

          .result-meta {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicalResultCard;
