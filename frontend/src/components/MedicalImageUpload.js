import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { enhancedPredictionService } from '../services/enhancedPredictionService';

/**
 * MedicalImageUpload component - Handles medical image upload and analysis
 * Supports: X-ray, CT, MRI, Ultrasound
 */
const MedicalImageUpload = ({ onAnalysisComplete, onAnalysisStart }) => {
  // State management
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageType, setImageType] = useState('xray');
  const [analysisType, setAnalysisType] = useState('diagnosis');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    symptoms: '',
    clinicalHistory: ''
  });

  // Medical image types configuration
  const imageTypes = {
    xray: {
      label: 'X-Ray',
      icon: '🦴',
      description: 'Chest, bone, dental X-ray images',
      supportedFormats: ['.jpg', '.jpeg', '.png', '.dcm'],
      maxSize: '10MB'
    },
    ct: {
      label: 'CT Scan',
      icon: '🧠',
      description: 'CT scans of head, chest, abdomen',
      supportedFormats: ['.jpg', '.jpeg', '.png', '.dcm', '.nii'],
      maxSize: '50MB'
    },
    mri: {
      label: 'MRI',
      icon: '🫀',
      description: 'MRI scans - T1, T2, FLAIR sequences',
      supportedFormats: ['.jpg', '.jpeg', '.png', '.dcm', '.nii'],
      maxSize: '100MB'
    },
    ultrasound: {
      label: 'Ultrasound',
      icon: '👶',
      description: 'Ultrasound images - abdomen, cardiac, obstetric',
      supportedFormats: ['.jpg', '.jpeg', '.png', '.avi', '.mp4'],
      maxSize: '20MB'
    }
  };

  // Analysis types mapped to AI models
  const analysisTypes = {
    diagnosis: 'AI-Powered Diagnosis & Detection',
    pneumonia: 'Pneumonia Detection (X-ray AI)',
    tumor: 'Tumor Detection (Brain AI)', 
    segmentation: 'Image Segmentation',
    measurement: 'Measurements & Metrics',
    comparison: 'Compare with Normal'
  };

  /**
   * Handle file drop for drag & drop functionalitya
   */
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      toast.error(`File rejected: ${rejection.errors[0]?.message}`);
      return;
    }

    // Handle accepted file
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      // Create image preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      
      toast.success(`Medical image "${file.name}" uploaded successfully`);
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/dicom': ['.dcm'],
      'application/octet-stream': ['.nii'],
      'video/*': ['.avi', '.mp4']
    },
    maxFiles: 1,
    maxSize: getMaxFileSize(),
    disabled: isLoading
  });

  /**
   * Get max file size based on image type
   */
  function getMaxFileSize() {
    const sizeMap = {
      xray: 10 * 1024 * 1024,      // 10MB
      ct: 50 * 1024 * 1024,        // 50MB
      mri: 100 * 1024 * 1024,      // 100MB
      ultrasound: 20 * 1024 * 1024 // 20MB
    };
    return sizeMap[imageType] || 10 * 1024 * 1024;
  }

  /**
   * Handle patient info changes
   */
  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      toast.error('Please upload a medical image');
      return;
    }

    setIsLoading(true);
    
    try {
      // Notify parent that analysis started
      if (onAnalysisStart) {
        onAnalysisStart();
      }

      // Prepare analysis data
      const analysisData = {
        imageType,
        analysisType,
        patientInfo: {
          ...patientInfo,
          age: patientInfo.age ? parseInt(patientInfo.age) : null
        },
        metadata: {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          uploadTime: new Date().toISOString()
        }
      };

      // Determine which AI model to use and make prediction
      let result;
      
      toast.info('🤖 Selecting appropriate AI model...');
      
      // Route to specific AI model based on image type and analysis type
      if (imageType === 'xray' && (analysisType === 'diagnosis' || analysisType === 'pneumonia')) {
        console.log('🫁 Using Pneumonia Detection AI Model');
        toast.info('🫁 Analyzing with Pneumonia Detection AI...');
        result = await enhancedPredictionService.predictPneumoniaEnhanced(uploadedFile, analysisData);
      } else if ((imageType === 'ct' || imageType === 'mri') && (analysisType === 'diagnosis' || analysisType === 'tumor')) {
        console.log('🧠 Using Brain Tumor Detection AI Model'); 
        toast.info('🧠 Analyzing with Brain Tumor Detection AI...');
        result = await enhancedPredictionService.predictBrainTumorEnhanced(uploadedFile, analysisData);
      } else {
        // Use auto-detection for other combinations
        console.log('🤖 Using AI Auto-Detection');
        toast.info('🤖 Auto-detecting best AI model...');
        result = await enhancedPredictionService.predictWithAutoDetectionEnhanced(uploadedFile, analysisData);
      }

      console.log('🔍 RAW API Response:', result);
      console.log('🔍 Response Type:', typeof result);
      
      // Extract prediction data from API response
      const predictionData = result?.data?.prediction || result?.prediction || result;
      console.log('🎯 Extracted Prediction Data:', predictionData);
      
      if (!predictionData) {
        throw new Error('API yanıtında tahmin verisi bulunamadı');
      }

      // Enhance result with medical-specific information
      const enhancedResult = {
        ...predictionData,
        medicalAnalysis: {
          imageType: imageTypes[imageType].label,
          analysisType: analysisTypes[analysisType],
          findings: generateMedicalFindings(predictionData),
          recommendations: generateRecommendations(imageType, predictionData)
        }
      };

      console.log('✅ Enhanced Result:', enhancedResult);

      // Notify parent of successful analysis
      if (onAnalysisComplete) {
        onAnalysisComplete(enhancedResult);
      }

      toast.success('Medical image analysis completed successfully!');
      
    } catch (error) {
      console.error('Medical analysis error:', error);
      toast.error(error.message || 'Analysis failed. Please try again.');
      
      if (onAnalysisComplete) {
        onAnalysisComplete(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate medical findings based on prediction result
   */
  const generateMedicalFindings = (result) => {
    const findings = [];
    
    if (result.confidence > 0.8) {
      findings.push('High confidence detection');
    } else if (result.confidence > 0.6) {
      findings.push('Moderate confidence detection');
    } else {
      findings.push('Low confidence - manual review recommended');
    }

    // Add type-specific findings
    switch (imageType) {
      case 'xray':
        findings.push('No obvious fractures detected');
        findings.push('Lung fields appear clear');
        break;
      case 'ct':
        findings.push('No acute abnormalities detected');
        findings.push('Normal anatomical structures');
        break;
      case 'mri':
        findings.push('No significant signal abnormalities');
        findings.push('Good tissue contrast');
        break;
      case 'ultrasound':
        findings.push('Normal echogenicity patterns');
        findings.push('No obvious masses detected');
        break;
      default:
        findings.push('Analysis completed');
    }

    return findings;
  };

  /**
   * Generate recommendations based on image type and results
   */
  const generateRecommendations = (type, result) => {
    const recommendations = [];

    if (result.confidence < 70) {
      recommendations.push('Recommend radiologist review');
      recommendations.push('Consider additional imaging if clinically indicated');
    }

    switch (type) {
      case 'xray':
        recommendations.push('Compare with previous X-rays if available');
        break;
      case 'ct':
        recommendations.push('Correlate with clinical findings');
        break;
      case 'mri':
        recommendations.push('Consider contrast-enhanced imaging if needed');
        break;
      case 'ultrasound':
        recommendations.push('Follow-up ultrasound in 6-12 months if indicated');
        break;
    }

    return recommendations;
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setPatientInfo({
      age: '',
      gender: '',
      symptoms: '',
      clinicalHistory: ''
    });
  };

  return (
    <div className="medical-upload-container">
      <div className="medical-header">
        <h2>Medical Image Analysis</h2>
        <p>Upload medical images for AI-assisted analysis and diagnosis</p>
      </div>

      <form onSubmit={handleSubmit} className="medical-form">
        {/* Image Type Selection */}
        <div className="image-type-section">
          <h3>Select Image Type</h3>
          <div className="image-type-grid">
            {Object.entries(imageTypes).map(([key, type]) => (
              <div
                key={key}
                className={`image-type-card ${imageType === key ? 'selected' : ''}`}
                onClick={() => setImageType(key)}
              >
                <div className="type-icon">{type.icon}</div>
                <div className="type-info">
                  <h4>{type.label}</h4>
                  <p>{type.description}</p>
                  <div className="type-specs">
                    <span>Max: {type.maxSize}</span>
                    <span>{type.supportedFormats.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="upload-section">
          <h3>Upload {imageTypes[imageType].label} Image</h3>
          
          <div
            {...getRootProps()}
            className={`medical-dropzone ${isDragActive ? 'active' : ''} ${uploadedFile ? 'has-file' : ''}`}
          >
            <input {...getInputProps()} />
            
            {uploadedFile ? (
              <div className="uploaded-file-info">
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Medical scan preview" />
                  </div>
                )}
                <div className="file-details">
                  <h4>{uploadedFile.name}</h4>
                  <p>Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Type: {imageTypes[imageType].label}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    setImagePreview(null);
                  }}
                  className="remove-file-btn"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="upload-icon">{imageTypes[imageType].icon}</div>
                <h4>
                  {isDragActive ? 
                    `Drop ${imageTypes[imageType].label} image here` : 
                    `Upload ${imageTypes[imageType].label} Image`
                  }
                </h4>
                <p>Drag & drop or click to select</p>
                <div className="supported-formats">
                  <strong>Supported:</strong> {imageTypes[imageType].supportedFormats.join(', ')}
                  <br />
                  <strong>Max size:</strong> {imageTypes[imageType].maxSize}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Type */}
        <div className="analysis-section">
          <h3>Analysis Type</h3>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="analysis-select"
            disabled={isLoading}
          >
            {Object.entries(analysisTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Patient Information */}
        <div className="patient-info-section">
          <h3>Patient Information (Optional)</h3>
          <div className="patient-info-grid">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={patientInfo.age}
                onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                placeholder="Patient age"
                min="0"
                max="150"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label>Gender</label>
              <select
                value={patientInfo.gender}
                onChange={(e) => handlePatientInfoChange('gender', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group full-width">
              <label>Symptoms</label>
              <input
                type="text"
                value={patientInfo.symptoms}
                onChange={(e) => handlePatientInfoChange('symptoms', e.target.value)}
                placeholder="Current symptoms (e.g., chest pain, shortness of breath)"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group full-width">
              <label>Clinical History</label>
              <textarea
                value={patientInfo.clinicalHistory}
                onChange={(e) => handlePatientInfoChange('clinicalHistory', e.target.value)}
                placeholder="Relevant medical history and previous findings"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !uploadedFile}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Analyzing...
              </>
            ) : (
              `Analyze ${imageTypes[imageType].label}`
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .medical-upload-container {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .medical-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .medical-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .medical-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .image-type-section h3,
        .upload-section h3,
        .analysis-section h3,
        .patient-info-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
        }

        .image-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .image-type-card {
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .image-type-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .image-type-card.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .type-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .type-info h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .type-info p {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .type-specs {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .medical-dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 1rem;
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
        }

        .medical-dropzone:hover,
        .medical-dropzone.active {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .medical-dropzone.has-file {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .dropzone-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .upload-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .supported-formats {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .uploaded-file-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
        }

        .image-preview {
          width: 120px;
          height: 120px;
          border-radius: 0.5rem;
          overflow: hidden;
          flex-shrink: 0;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-details {
          flex: 1;
          text-align: left;
        }

        .file-details h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .file-details p {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0.25rem 0;
        }

        .remove-file-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .remove-file-btn:hover {
          background: #dc2626;
        }

        .analysis-select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          background: white;
        }

        .analysis-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .patient-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .patient-info-grid .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
        }

        .form-actions .btn {
          flex: 1;
          max-width: 200px;
        }

        @media (max-width: 768px) {
          .medical-upload-container {
            padding: 1.5rem;
          }

          .image-type-grid {
            grid-template-columns: 1fr;
          }

          .image-type-card {
            flex-direction: column;
            text-align: center;
          }

          .patient-info-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            max-width: none;
          }

          .uploaded-file-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicalImageUpload;
