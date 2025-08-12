import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudUploadAlt,
  faImage,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faEye,
  faRobot,
  faStethoscope,
  faBrain,
  faLungs
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { enhancedPredictionService } from '../services/enhancedPredictionService';
import { toast } from 'react-toastify';

const UploadContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const DropzoneArea = styled.div`
  border: 3px dashed ${props => props.isDragActive ? '#667eea' : '#ddd'};
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  background: ${props => props.isDragActive ? 'rgba(102, 126, 234, 0.1)' : 'white'};
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
  
  .upload-icon {
    font-size: 3rem;
    color: ${props => props.isDragActive ? '#667eea' : '#ccc'};
    margin-bottom: 15px;
  }
  
  .upload-text {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 10px;
  }
  
  .upload-hint {
    font-size: 0.9rem;
    color: #999;
  }
`;

const ModelSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const ModelOption = styled.div`
  padding: 20px;
  border: 2px solid ${props => props.selected ? '#667eea' : '#e0e0e0'};
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.1)' : 'white'};
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .model-icon {
    font-size: 2rem;
    color: ${props => props.selected ? '#667eea' : '#999'};
    margin-bottom: 10px;
  }
  
  .model-name {
    font-weight: 600;
    color: ${props => props.selected ? '#667eea' : '#333'};
    margin-bottom: 5px;
  }
  
  .model-description {
    font-size: 0.85rem;
    color: #666;
  }
`;

const PatientInfoForm = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  h3 {
    margin: 0 0 15px 0;
    color: #333;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .form-group {
    .label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
    }
    
    input, select, textarea {
      width: 100%;
      padding: 10px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
  }
`;

const ImagePreview = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .preview-image {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  .image-info {
    margin-top: 15px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    
    .info-item {
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 0.9rem;
      
      .label {
        font-weight: 600;
        color: #555;
      }
      
      .value {
        color: #333;
      }
    }
  }
`;

const PredictionResult = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  .result-header {
    text-align: center;
    margin-bottom: 25px;
    
    .result-icon {
      font-size: 3rem;
      color: ${props => props.isPositive ? '#f44336' : '#4caf50'};
      margin-bottom: 10px;
    }
    
    .result-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${props => props.isPositive ? '#f44336' : '#4caf50'};
      margin-bottom: 5px;
    }
    
    .result-subtitle {
      color: #666;
      font-size: 1rem;
    }
  }
  
  .confidence-bar {
    margin-bottom: 20px;
    
    .confidence-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      .label {
        font-weight: 600;
        color: #333;
      }
      
      .value {
        font-weight: bold;
        color: ${props => props.isPositive ? '#f44336' : '#4caf50'};
      }
    }
    
    .progress-bar {
      height: 12px;
      background: #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, 
          ${props => props.isPositive ? '#f44336' : '#4caf50'}, 
          ${props => props.isPositive ? '#ff7961' : '#81c784'}
        );
        width: ${props => props.confidence}%;
        transition: width 1s ease;
      }
    }
  }
  
  .medical-interpretation {
    background: #f8f9fa;
    border-left: 4px solid ${props => props.isPositive ? '#f44336' : '#4caf50'};
    padding: 15px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 20px;
    
    .interpretation-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .interpretation-text {
      color: #555;
      line-height: 1.6;
    }
  }
  
  .all-predictions {
    .predictions-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
    }
    
    .prediction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .class-name {
        font-weight: 500;
        color: #333;
      }
      
      .class-confidence {
        font-weight: bold;
        color: #667eea;
      }
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  
  button {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }
    
    &.secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      
      &:hover {
        background: #667eea;
        color: white;
      }
    }
  }
`;

const AdvancedMedicalUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [patientInfo, setPatientInfo] = useState({
    patientId: '',
    patientName: '',
    age: '',
    weight: '',
    gender: '',
    symptoms: '',
    medicalHistory: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const modelOptions = [
    {
      id: 'auto',
      name: 'Otomatik Tespit',
      description: 'Dosya adına göre model seçimi',
      icon: faRobot
    },
    {
      id: 'pneumonia',
      name: 'Pneumonia',
      description: 'Göğüs röntgeni analizi',
      icon: faLungs
    },
    {
      id: 'brainTumor',
      name: 'Brain Tumor',
      description: 'Beyin MRI/CT analizi',
      icon: faBrain
    },
    {
      id: 'tuberculosis',
      name: 'Tuberculosis',
      description: 'Tüberküloz tespiti',
      icon: faStethoscope
    }
  ];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      
      // Image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous prediction
      setPrediction(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrediction = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir görüntü dosyası seçin');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (selectedModel === 'auto') {
        result = await enhancedPredictionService.predictWithAutoDetectionEnhanced(selectedFile, patientInfo);
      } else {
        const modelMethods = {
          pneumonia: enhancedPredictionService.predictPneumoniaEnhanced,
          brainTumor: enhancedPredictionService.predictBrainTumorEnhanced,
          tuberculosis: enhancedPredictionService.predictTuberculosisEnhanced
        };
        
        result = await modelMethods[selectedModel](selectedFile, patientInfo);
      }

      setPrediction(result);
      toast.success('Analiz tamamlandı!');
      
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.message || 'Analiz sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setPrediction(null);
    setPatientInfo({
      patientId: '',
      patientName: '',
      age: '',
      weight: '',
      gender: '',
      symptoms: '',
      medicalHistory: ''
    });
  };

  const saveReport = async () => {
    if (!prediction) return;
    
    try {
      // Report kaydetme logic'i burada olacak
      console.log('Saving report...', { prediction, patientInfo });
      toast.success('Rapor kaydedildi!');
    } catch (error) {
      console.error('Save report error:', error);
      toast.error('Rapor kaydedilirken hata oluştu');
    }
  };

  return (
    <UploadContainer>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Medikal Görüntü Analizi
      </h2>

      {/* Model Selection */}
      <ModelSelector>
        {modelOptions.map(model => (
          <ModelOption
            key={model.id}
            selected={selectedModel === model.id}
            onClick={() => setSelectedModel(model.id)}
          >
            <div className="model-icon">
              <FontAwesomeIcon icon={model.icon} />
            </div>
            <div className="model-name">{model.name}</div>
            <div className="model-description">{model.description}</div>
          </ModelOption>
        ))}
      </ModelSelector>

      {/* File Upload */}
      <DropzoneArea {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="upload-icon">
          <FontAwesomeIcon icon={faCloudUploadAlt} />
        </div>
        <div className="upload-text">
          {isDragActive ? 'Dosyayı buraya bırakın' : 'Görüntü dosyasını sürükleyin veya tıklayın'}
        </div>
        <div className="upload-hint">
          Desteklenen formatlar: JPEG, PNG, GIF, BMP, TIFF (Maks. 10MB)
        </div>
      </DropzoneArea>

      {/* Patient Information */}
      <PatientInfoForm>
        <h3>Hasta Bilgileri</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Hasta ID</label>
            <input
              type="text"
              value={patientInfo.patientId}
              onChange={(e) => handlePatientInfoChange('patientId', e.target.value)}
              placeholder="Hasta kimlik numarası"
            />
          </div>
          <div className="form-group">
            <label className="label">Hasta Adı</label>
            <input
              type="text"
              value={patientInfo.patientName}
              onChange={(e) => handlePatientInfoChange('patientName', e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="label">Yaş</label>
            <input
              type="number"
              min="0"
              max="150"
              value={patientInfo.age}
              onChange={(e) => handlePatientInfoChange('age', e.target.value)}
              placeholder="Yaş"
            />
          </div>
          <div className="form-group">
            <label className="label">Kilo (kg)</label>
            <input
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={patientInfo.weight}
              onChange={(e) => handlePatientInfoChange('weight', e.target.value)}
              placeholder="Kilo"
            />
          </div>
          <div className="form-group">
            <label className="label">Cinsiyet</label>
            <select
              value={patientInfo.gender}
              onChange={(e) => handlePatientInfoChange('gender', e.target.value)}
            >
              <option value="">Seçin</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="label">Semptomlar</label>
            <textarea
              value={patientInfo.symptoms}
              onChange={(e) => handlePatientInfoChange('symptoms', e.target.value)}
              placeholder="Mevcut semptomlar..."
            />
          </div>
          <div className="form-group">
            <label className="label">Tıbbi Geçmiş</label>
            <textarea
              value={patientInfo.medicalHistory}
              onChange={(e) => handlePatientInfoChange('medicalHistory', e.target.value)}
              placeholder="Önceki hastalıklar, ameliyatlar..."
            />
          </div>
        </div>
      </PatientInfoForm>

      {/* Image Preview */}
      {selectedFile && imagePreview && (
        <ImagePreview>
          <div className="preview-header">
            <h3>Seçilen Görüntü</h3>
            <button
              onClick={() => {
                setSelectedFile(null);
                setImagePreview(null);
              }}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#999', cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <img src={imagePreview} alt="Preview" className="preview-image" />
          
          <div className="image-info">
            <div className="info-item">
              <div className="label">Dosya Adı:</div>
              <div className="value">{selectedFile.name}</div>
            </div>
            <div className="info-item">
              <div className="label">Boyut:</div>
              <div className="value">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div className="info-item">
              <div className="label">Tip:</div>
              <div className="value">{selectedFile.type}</div>
            </div>
            <div className="info-item">
              <div className="label">Seçilen Model:</div>
              <div className="value">{modelOptions.find(m => m.id === selectedModel)?.name}</div>
            </div>
          </div>
        </ImagePreview>
      )}

      {/* Prediction Result */}
      {prediction && (
        <PredictionResult 
          isPositive={prediction.isPositive} 
          confidence={prediction.confidence}
        >
          <div className="result-header">
            <div className="result-icon">
              <FontAwesomeIcon 
                icon={prediction.isPositive ? faExclamationTriangle : faCheckCircle} 
              />
            </div>
            <div className="result-title">{prediction.prediction}</div>
            <div className="result-subtitle">
              {prediction.modelType} Model Sonucu
            </div>
          </div>

          <div className="confidence-bar">
            <div className="confidence-label">
              <span className="label">Güven Seviyesi</span>
              <span className="value">{prediction.confidence}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>

          <div className="medical-interpretation">
            <div className="interpretation-title">Tıbbi Yorum</div>
            <div className="interpretation-text">
              {prediction.medicalInterpretation}
            </div>
          </div>

          {prediction.allClasses && prediction.allClasses.length > 0 && (
            <div className="all-predictions">
              <div className="predictions-title">Tüm Sınıf Sonuçları</div>
              {prediction.allClasses.map((cls, index) => (
                <div key={index} className="prediction-item">
                  <span className="class-name">{cls.class}</span>
                  <span className="class-confidence">{cls.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </PredictionResult>
      )}

      {/* Action Buttons */}
      <ActionButtons>
        {!prediction ? (
          <>
            <button 
              className="primary" 
              onClick={handlePrediction}
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faStethoscope} />
                  Analiz Et
                </>
              )}
            </button>
            
            {selectedFile && (
              <button className="secondary" onClick={resetUpload}>
                <FontAwesomeIcon icon={faTimes} />
                Temizle
              </button>
            )}
          </>
        ) : (
          <>
            <button className="primary" onClick={saveReport}>
              <FontAwesomeIcon icon={faCheckCircle} />
              Raporu Kaydet
            </button>
            
            <button className="secondary" onClick={resetUpload}>
              <FontAwesomeIcon icon={faPlus} />
              Yeni Analiz
            </button>
          </>
        )}
      </ActionButtons>
    </UploadContainer>
  );
};

export default AdvancedMedicalUpload;
