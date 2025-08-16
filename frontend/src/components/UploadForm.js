import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { predictionService } from '../services/predictionService';

/**
 * UploadForm component - Handles file upload and manual input for predictions
 * Features: Drag & drop file upload, manual data input, form validation
 */
const UploadForm = ({ onPredictionComplete, onPredictionStart }) => {
  // State management
  const [inputData, setInputData] = useState({
    feature1: '',
    feature2: '',
    feature3: '',
    feature4: '',
    feature5: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'file'
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [errors, setErrors] = useState({});

  /**
   * Handle file drop for drag & drop functionality
   */
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors) {
        const errorMsg = rejection.errors[0].message;
        toast.error(`File rejected: ${errorMsg}`);
      }
      return;
    }

    // Handle accepted file
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded successfully`);
      
      // If it's a CSV or JSON file, try to parse it
      if (file.type === 'text/csv' || file.type === 'application/json' || file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            if (file.type === 'application/json') {
              const jsonData = JSON.parse(content);
              setTextInput(JSON.stringify(jsonData, null, 2));
            } else {
              setTextInput(content);
            }
          } catch (error) {
            console.error('Error parsing file:', error);
            toast.warning('Could not parse file content automatically');
          }
        };
        reader.readAsText(file);
      }
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading
  });

  /**
   * Handle input field changes
   */
  const handleInputChange = (field, value) => {
    setInputData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  /**
   * Handle text input change (for JSON/CSV input)
   */
  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    
    // Clear text input error
    if (errors.textInput) {
      setErrors(prev => ({
        ...prev,
        textInput: null
      }));
    }
  };

  /**
   * Validate form inputs
   */
  const validateInputs = () => {
    const newErrors = {};

    if (inputMode === 'manual') {
      // Validate manual input fields
      const requiredFields = ['feature1', 'feature2', 'feature3'];
      
      requiredFields.forEach(field => {
        if (!inputData[field] || inputData[field].trim() === '') {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        } else if (isNaN(Number(inputData[field]))) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`;
        }
      });
      
      // Optional fields validation
      ['feature4', 'feature5'].forEach(field => {
        if (inputData[field] && inputData[field].trim() !== '' && isNaN(Number(inputData[field]))) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`;
        }
      });

    } else if (inputMode === 'file') {
      // Validate file input
      if (!uploadedFile && !textInput.trim()) {
        newErrors.file = 'Please upload a file or provide text input';
      }
      
      if (textInput.trim()) {
        try {
          JSON.parse(textInput);
        } catch (e) {
          // If it's not JSON, check if it's comma-separated values
          const values = textInput.split(',').map(v => v.trim());
          const hasInvalidValues = values.some(v => v && isNaN(Number(v)));
          
          if (hasInvalidValues) {
            newErrors.textInput = 'Input should be valid JSON or comma-separated numbers';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Prepare data for prediction based on input mode
   */
  const prepareInputData = () => {
    if (inputMode === 'manual') {
      // Convert manual input to numbers and filter out empty values
      const data = {};
      Object.keys(inputData).forEach(key => {
        if (inputData[key] && inputData[key].trim() !== '') {
          data[key] = Number(inputData[key]);
        }
      });
      return data;
    } else {
      // File/text input mode
      if (textInput.trim()) {
        try {
          // Try to parse as JSON first
          return JSON.parse(textInput);
        } catch (e) {
          // If not JSON, try comma-separated values
          const values = textInput.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v));
          return values;
        }
      }
      return null;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);
    
    try {
      // Notify parent that prediction started
      if (onPredictionStart) {
        onPredictionStart();
      }

      // Prepare input data
      const preparedData = prepareInputData();
      
      if (!preparedData) {
        throw new Error('No valid input data provided');
      }

      // Validate input data
      predictionService.validateInputData(preparedData);

      // Make prediction
      const result = await predictionService.makePrediction(
        preparedData,
        uploadedFile
      );

      // Notify parent of successful prediction
      if (onPredictionComplete) {
        onPredictionComplete(result);
      }

      toast.success('Prediction completed successfully!');

      // Reset form
      resetForm();

    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.message || 'Prediction failed. Please try again.');
      
      // Notify parent of prediction completion (even if failed)
      if (onPredictionComplete) {
        onPredictionComplete(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setInputData({
      feature1: '',
      feature2: '',
      feature3: '',
      feature4: '',
      feature5: ''
    });
    setUploadedFile(null);
    setTextInput('');
    setErrors({});
  };

  /**
   * Remove uploaded file
   */
  const removeFile = () => {
    setUploadedFile(null);
    setTextInput('');
    toast.info('File removed');
  };

  return (
    <div className="upload-form-container">
      <div className="form-header">
        <h2>Make a Prediction</h2>
        <p>Choose your input method and provide the necessary data for AI prediction.</p>
      </div>

      {/* Input Mode Selector */}
      <div className="input-mode-selector">
        <button
          type="button"
          className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => setInputMode('manual')}
          disabled={isLoading}
        >
          Manual Input
        </button>
        <button
          type="button"
          className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
          onClick={() => setInputMode('file')}
          disabled={isLoading}
        >
          File Upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">
        {inputMode === 'manual' ? (
          /* Manual Input Fields */
          <div className="manual-input-section">
            <div className="input-grid">
              {Object.keys(inputData).map((field, index) => (
                <div key={field} className="form-group">
                  <label className="form-label">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {index < 3 && <span className="required">*</span>}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className={`form-input ${errors[field] ? 'error' : ''}`}
                    value={inputData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`Enter ${field}`}
                    disabled={isLoading}
                  />
                  {errors[field] && <div className="form-error">{errors[field]}</div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* File Upload Section */
          <div className="file-input-section">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${uploadedFile ? 'has-file' : ''}`}
            >
              <input {...getInputProps()} />
              
              {uploadedFile ? (
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <p className="file-name">{uploadedFile.name}</p>
                    <p className="file-size">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="remove-file-btn"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="upload-icon">📁</div>
                  <p className="dropzone-text">
                    {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="dropzone-hint">
                    Supported: Images (JPG, PNG, GIF), CSV, JSON, TXT (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {errors.file && <div className="form-error">{errors.file}</div>}

            {/* Text Input Alternative */}
            <div className="text-input-section">
              <label className="form-label">Or paste your data directly:</label>
              <textarea
                className={`form-textarea ${errors.textInput ? 'error' : ''}`}
                value={textInput}
                onChange={handleTextInputChange}
                placeholder="Paste JSON data or comma-separated values (e.g., 1.5, 2.3, 4.1, 0.8)"
                rows={4}
                disabled={isLoading}
              />
              {errors.textInput && <div className="form-error">{errors.textInput}</div>}
              <div className="input-hint">
                Examples:
                <br />• JSON: {"{"}"feature1": 1.5, "feature2": 2.3{"}"}
                <br />• CSV: 1.5, 2.3, 4.1, 0.8
              </div>
            </div>
          </div>
        )}

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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              'Make Prediction'
            )}
          </button>
        </div>
      </form>

      <style jsx="true">{`
        .upload-form-container {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-header h2 {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .form-header p {
          color: #6b7280;
        }

        .input-mode-selector {
          display: flex;
          background: #f3f4f6;
          border-radius: 0.75rem;
          padding: 0.25rem;
          margin-bottom: 2rem;
        }

        .mode-btn {
          flex: 1;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .mode-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .required {
          color: #ef4444;
          margin-left: 0.25rem;
        }

        .dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 1.5rem;
        }

        .dropzone:hover,
        .dropzone.active {
          border-color: #4f46e5;
          background-color: #f8fafc;
        }

        .dropzone.has-file {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .dropzone-text {
          font-weight: 500;
          color: #374151;
        }

        .dropzone-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-details {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-weight: 500;
          color: #374151;
        }

        .file-size {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .remove-file-btn {
          position: absolute;
          top: -0.5rem;
          right: -0.5rem;
          width: 1.5rem;
          height: 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-input-section {
          margin-top: 1.5rem;
        }

        .input-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          line-height: 1.4;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
        }

        .form-actions .btn {
          flex: 1;
          max-width: 200px;
        }

        @media (max-width: 768px) {
          .upload-form-container {
            padding: 1.5rem;
          }

          .input-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadForm;
