import React, { useState, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabaseClient';
import CameraCapture from './CameraCapture';
import PieChart from './PieChart';
import './App.css';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrText, setOcrText] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      setError("Could not fetch categories from the database.");
      console.error(error);
    } else {
      setCategories(data);
    }
    setIsLoading(false);
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    const { error } = await supabase
      .from('categories')
      .update({ total_spent: 0 })
      .gt('id', 0);

    if (error) {
      setError("Could not reset category totals.");
      console.error(error);
    } else {
      await fetchCategories();
    }
    setIsResetting(false);
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };
  
  const handleCancel = () => {
    setSelectedFile(null);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };

  const handleCapture = (file) => {
    setSelectedFile(file);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
    setCameraActive(false);
  };

  const handleCameraCancel = () => {
    setCameraActive(false);
  };
  
  const handleCameraStart = () => {
    setCameraActive(true);
    setSelectedFile(null);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
    
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(selectedFile);
      await worker.terminate();

      setOcrText(text);

      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `From the following receipt text, extract the store name and the final total. Classify the store into one of the following categories: "Clothing", "Food and Drink", "Utilities", "Entertainment", or "Other". Please return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. If you cannot find a value for a field, use null. The JSON object must have these keys: "storeName", "total", "category".\n\nReceipt Text:\n${text}`
        }],
      });
      
      let responseText = msg.content[0].text;
      let jsonData;

      try {
        jsonData = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonData = JSON.parse(jsonMatch[0]);
          } catch (nestedParseError) {
             throw new Error("Could not parse the structured data from the AI's response.");
          }
        } else {
          throw new Error("The AI's response was not in the expected format.");
        }
      }
      setStructuredData(jsonData);

      if (jsonData.category && jsonData.total) {
        const amount = parseFloat(String(jsonData.total).replace(/[^0-9.-]+/g, ""));
        
        if (isNaN(amount)) {
          throw new Error(`Invalid total amount received from AI: ${jsonData.total}`);
        }

        const categoryName = jsonData.category.replace(/^"|"$/g, '').trim();

        const { data: categoryData, error: fetchError } = await supabase
          .from('categories')
          .select('id, total_spent')
          .ilike('name', categoryName)
          .single();

        if (fetchError || !categoryData) {
          throw new Error(`Could not find the category "${categoryName}" in the database.`);
        }

        const newTotal = categoryData.total_spent + amount;

        const { error: updateError } = await supabase
          .from('categories')
          .update({ total_spent: newTotal })
          .eq('id', categoryData.id);

        if (updateError) {
          throw new Error(`Could not update category total: ${updateError.message}`);
        }
        
        await fetchCategories();
      } else {
        throw new Error("AI response did not include a 'category' and a 'total'.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const grandTotal = categories.reduce((total, category) => total + (category.total_spent || 0), 0);

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="App">
       <div className="top-bar">
        <h1>Receipt Budget Assistant</h1>
      </div>
      <div className="content-row">
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
              onChange={handleFileSelect}
            />
          </div>
          
          {cameraActive && (
            <CameraCapture
              onCapture={handleCapture}
              onCancel={handleCameraCancel}
            />
          )}
          
          {selectedFile && (
            <div className="selection-area">
              <div className="image-preview">
                <img src={previewUrl} alt="Selected preview" />
              </div>
              <p>Selected: {selectedFile.name}</p>
              <div className="action-buttons">
                <button onClick={handleRecognize} disabled={isExtracting}>
                  {isExtracting ? 'Processing...' : 'Extract & Analyze'}
                </button>
                <button onClick={handleCancel} className="cancel-button">
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
              <pre>
                {ocrText}
              </pre>
            </div>
          )}
        </div>
        <div className="spending-breakdown-card">
          <div className="category-header">
            <h2>Spending Breakdown</h2>
            <button onClick={handleReset} className="reset-button" disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset All'}
            </button>
          </div>
          <div className="chart-section">
            <PieChart categories={categories} />
          </div>
          <div className="categories-list">
            <ul>
              {categories.map(cat => (
                <li key={cat.id}>
                  <span>{cat.name}</span>
                  <strong>${(cat.total_spent || 0).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
            <hr className="total-divider" />
            <div className="grand-total">
              <span>Total Spending</span>
              <strong>${grandTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;