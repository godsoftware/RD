import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory,
  faEye,
  faTrash,
  faDownload,
  faSearch,
  faFilter,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faBrain,
  faLungs,
  faStethoscope,
  faCalendarAlt,
  faUser,
  faFileImage,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { enhancedPredictionService } from '../services/enhancedPredictionService';
import { toast } from 'react-toastify';

const HistoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
  
  h2 {
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  .filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .filter-group {
    .label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
    }
    
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
  }
  
  .search-button {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
`;

const HistoryList = styled.div`
  display: grid;
  gap: 20px;
`;

const HistoryItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    
    .item-info {
      flex: 1;
      
      .item-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .item-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        font-size: 0.9rem;
        color: #666;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
      }
    }
    
    .item-actions {
      display: flex;
      gap: 10px;
      
      button {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        
        &.view-btn {
          background: #667eea;
          color: white;
          
          &:hover {
            background: #5a6fd8;
          }
        }
        
        &.delete-btn {
          background: #f44336;
          color: white;
          
          &:hover {
            background: #d32f2f;
          }
        }
      }
    }
  }
  
  .item-content {
    .result-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
      
      .summary-card {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        
        .summary-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        
        .summary-label {
          font-size: 0.85rem;
          color: #666;
        }
        
        &.positive {
          background: linear-gradient(135deg, #ffebee, #ffcdd2);
          
          .summary-value {
            color: #f44336;
          }
        }
        
        &.negative {
          background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
          
          .summary-value {
            color: #4caf50;
          }
        }
      }
    }
    
    .interpretation-preview {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 12px;
      border-radius: 0 8px 8px 0;
      margin-top: 15px;
      
      .interpretation-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }
      
      .interpretation-text {
        color: #555;
        line-height: 1.5;
        font-size: 0.9rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 10px;
  
  button {
    padding: 8px 16px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      border-color: #667eea;
      color: #667eea;
    }
    
    &.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-info {
    margin: 0 15px;
    color: #666;
    font-weight: 600;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  
  .loading-icon {
    font-size: 2rem;
    margin-bottom: 15px;
    color: #667eea;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    color: #ccc;
  }
  
  h3 {
    margin-bottom: 10px;
    color: #333;
  }
`;

const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalPredictions: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    patientId: '',
    modelType: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  const modelIcons = {
    pneumonia: faLungs,
    brainTumor: faBrain,
    tuberculosis: faStethoscope
  };

  const modelNames = {
    pneumonia: 'Pneumonia',
    brainTumor: 'Brain Tumor',
    tuberculosis: 'Tuberculosis'
  };

  useEffect(() => {
    loadPredictionHistory();
  }, [pagination.currentPage]);

  const loadPredictionHistory = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const response = await enhancedPredictionService.getEnhancedPredictionHistory(
        page, 
        10, 
        filters
      );
      
      setPredictions(response.predictions || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('History load error:', error);
      toast.error('Geçmiş yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadPredictionHistory(1);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleViewPrediction = (predictionId) => {
    // Navigate to detailed view
    window.open(`/prediction/${predictionId}`, '_blank');
  };

  const handleDeletePrediction = async (predictionId) => {
    if (!window.confirm('Bu tahmin kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await enhancedPredictionService.deleteEnhancedPrediction(predictionId);
      toast.success('Tahmin kaydı silindi');
      loadPredictionHistory();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getModelIcon = (modelType) => {
    return modelIcons[modelType] || faStethoscope;
  };

  const getModelName = (modelType) => {
    return modelNames[modelType] || modelType;
  };

  if (loading) {
    return (
      <HistoryContainer>
        <LoadingState>
          <div className="loading-icon">
            <FontAwesomeIcon icon={faSpinner} spin />
          </div>
          <div>Geçmiş yükleniyor...</div>
        </LoadingState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <HistoryHeader>
        <h2>
          <FontAwesomeIcon icon={faHistory} />
          Tahmin Geçmişi
        </h2>
      </HistoryHeader>

      <FiltersSection>
        <div className="filters-row">
          <div className="filter-group">
            <label className="label">Hasta ID</label>
            <input
              type="text"
              value={filters.patientId}
              onChange={(e) => handleFilterChange('patientId', e.target.value)}
              placeholder="Hasta ID ile ara..."
            />
          </div>
          
          <div className="filter-group">
            <label className="label">Model Tipi</label>
            <select
              value={filters.modelType}
              onChange={(e) => handleFilterChange('modelType', e.target.value)}
            >
              <option value="">Tüm Modeller</option>
              <option value="pneumonia">Pneumonia</option>
              <option value="brainTumor">Brain Tumor</option>
              <option value="tuberculosis">Tuberculosis</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="label">Başlangıç Tarihi</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="label">Bitiş Tarihi</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
        
        <button className="search-button" onClick={handleSearch}>
          <FontAwesomeIcon icon={faSearch} />
          Ara
        </button>
      </FiltersSection>

      {predictions.length === 0 ? (
        <EmptyState>
          <div className="empty-icon">
            <FontAwesomeIcon icon={faHistory} />
          </div>
          <h3>Henüz tahmin geçmişi yok</h3>
          <p>İlk medikal görüntü analizinizi yapın ve sonuçlar burada görünecek.</p>
        </EmptyState>
      ) : (
        <>
          <HistoryList>
            {predictions.map((prediction) => (
              <HistoryItem key={prediction.id}>
                <div className="item-header">
                  <div className="item-info">
                    <div className="item-title">
                      <FontAwesomeIcon 
                        icon={getModelIcon(prediction.result?.modelType)} 
                      />
                      {getModelName(prediction.result?.modelType)} - {prediction.result?.prediction}
                    </div>
                    <div className="item-meta">
                      <div className="meta-item">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {formatDate(prediction.createdAt)}
                      </div>
                      {prediction.patientInfo?.patientName && (
                        <div className="meta-item">
                          <FontAwesomeIcon icon={faUser} />
                          {prediction.patientInfo.patientName}
                        </div>
                      )}
                      <div className="meta-item">
                        <FontAwesomeIcon icon={faFileImage} />
                        {prediction.imageInfo?.originalName}
                      </div>
                      {prediction.processingTime && (
                        <div className="meta-item">
                          <FontAwesomeIcon icon={faChartLine} />
                          {prediction.processingTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewPrediction(prediction.id)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Görüntüle
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeletePrediction(prediction.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Sil
                    </button>
                  </div>
                </div>

                <div className="item-content">
                  <div className="result-summary">
                    <div className={`summary-card ${prediction.result?.isPositive ? 'positive' : 'negative'}`}>
                      <div className="summary-value">
                        <FontAwesomeIcon 
                          icon={prediction.result?.isPositive ? faExclamationTriangle : faCheckCircle} 
                        />
                        {prediction.result?.prediction}
                      </div>
                      <div className="summary-label">Sonuç</div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="summary-value">{prediction.result?.confidence}%</div>
                      <div className="summary-label">Güven</div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="summary-value">{prediction.status}</div>
                      <div className="summary-label">Durum</div>
                    </div>
                  </div>

                  {(prediction.result?.medicalInterpretation || prediction.result?.geminiInterpretation) && (
                    <div className="interpretation-preview">
                      <div className="interpretation-title">Tıbbi Yorum</div>
                      <div className="interpretation-text">
                        {prediction.result?.geminiInterpretation || prediction.result?.medicalInterpretation}
                      </div>
                    </div>
                  )}
                </div>
              </HistoryItem>
            ))}
          </HistoryList>

          {pagination.totalPages > 1 && (
            <Pagination>
              <button
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Önceki
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={page === pagination.currentPage ? 'active' : ''}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Sonraki
              </button>
              
              <div className="page-info">
                {pagination.totalPredictions} kayıt
              </div>
            </Pagination>
          )}
        </>
      )}
    </HistoryContainer>
  );
};

export default PredictionHistory;
