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
                  <span className="info-label">Receipt Total:</span>
                  <span className="info-value">${structuredData.total?.toFixed(2) || 'Not found'}</span>
                </div>
              </div>
              
              {structuredData.items && structuredData.items.length > 0 && (
                <div className="items-table">
                  <h4 className="items-table-title">Categorized Items</h4>
                  <div className="items-table-header">
                    <span className="item-desc">Description</span>
                    <span className="item-cat">Category</span>
                    <span className="item-price">Price</span>
                  </div>
                  {structuredData.items.map((item, index) => (
                    <div key={index} className="items-table-row">
                      <span className="item-desc">{item.description || 'N/A'}</span>
                      <span className="item-cat">{item.category || 'Other'}</span>
                      <span className="item-price">${item.price?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
              )}
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