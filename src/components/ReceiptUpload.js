import React, { useState } from 'react';
import CameraCapture from './camera/CameraCapture';
import ManualEntry from './forms/ManualEntry';

function ReceiptUpload({
  selectedFile,
  previewUrl,
  ocrText,
  structuredData,
  isExtracting,
  error,
  onFileSelect,
  onCapture,
  onCancel,
  onProcessReceipt,
  categories,
  onAddManualEntry,
  isSubmitting
}) {
  const [cameraActive, setCameraActive] = useState(false);

  const handleCameraStart = () => {
    setCameraActive(true);
  };

  const handleCameraCancel = () => {
    setCameraActive(false);
  };

  const handleCameraCapture = (file) => {
    onCapture(file);
    setCameraActive(false);
  };

  return (
    <div className="main-card">
      <div className="upload-buttons-container">
        <button
          className="camera-button"
          onClick={handleCameraStart}
          disabled={cameraActive}
        >
          Take a Picture
        </button>
        <label className="file-label" htmlFor="file-upload">Choose Image</label>
        <input
          id="file-upload"
          className="file-input"
          type="file"
          accept="image/png, image/jpeg"
          onChange={onFileSelect}
        />
      </div>

      {cameraActive ? (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
      ) : (
        <>
          {selectedFile && (
            <div className="selection-area">
              <div className="image-preview">
                <img src={previewUrl} alt="Selected preview" />
              </div>
              <p>Selected: {selectedFile.name}</p>
              <div className="action-buttons">
                <button onClick={onProcessReceipt} disabled={isExtracting}>
                  {isExtracting ? 'Processing...' : 'Extract & Analyze'}
                </button>
                <button onClick={onCancel} className="cancel-button">
                  Cancel
                </button>
              </div>
              {isExtracting && (
                <div className="extraction-loading">
                  <div className="loading-spinner"></div>
                  <p>Extracting text and analyzing receipt...</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}

          {structuredData && (
            <div className="data-display">
              <h3>Receipt Information:</h3>
              <div className="receipt-info">
                <div className="info-row">
                  <span className="info-label">Store Name:</span>
                  <span className="info-value">{structuredData.storeName || 'Not found'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total to Add:</span>
                  <span className="info-value">${structuredData.total || 'Not found'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{structuredData.category || 'Not found'}</span>
                </div>
              </div>
            </div>
          )}

          {ocrText && !structuredData && !error && !isExtracting && (
            <div className="data-display">
              <h3>Extracted Text:</h3>
              <pre>{ocrText}</pre>
            </div>
          )}

          <ManualEntry
            categories={categories}
            onAddEntry={onAddManualEntry}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </div>
  );
}

export default ReceiptUpload; 