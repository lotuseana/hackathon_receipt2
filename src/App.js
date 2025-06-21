import React, { useState, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabaseClient';
import CameraCapture from './CameraCapture';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle image preview
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
  };

  const handleReset = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const grandTotal = categories.reduce((total, category) => total + (category.total_spent || 0), 0);

  return (
    <div className="App">
      <div className="main-card">
        <h1>Receipt Budget Assistant</h1>
        <CameraCapture onCapture={(file) => {
          setSelectedFile(file);
          setOcrText(null);
          setStructuredData(null);
          setError(null);
        }} />
        <span className="or-divider">OR</span>
        <label className="file-label" htmlFor="file-upload">Choose Image</label>
        <input
          id="file-upload"
          className="file-input"
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileSelect}
        />
        {selectedFile && (
          <div className="selection-area">
            <div className="image-preview">
              <img src={previewUrl} alt="Selected preview" />
            </div>
            <p>Selected: {selectedFile.name}</p>
            <div className="action-buttons">
              <button onClick={handleRecognize} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Extract & Analyze'}
              </button>
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}
        {structuredData && (
          <div className="data-display">
            <h3>Structured Data:</h3>
            <pre>
              {JSON.stringify(structuredData, null, 2)}
            </pre>
          </div>
        )}
        {ocrText && !structuredData && !error && (
          <div className="data-display">
            <h3>Extracted Text:</h3>
            <pre>
              {ocrText}
            </pre>
          </div>
        )}
      </div>
      <div className="categories-display-card">
        <div className="category-header">
          <h2>Category Spending</h2>
          <button onClick={handleReset} className="reset-button" disabled={isLoading}>Reset All</button>
        </div>
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
  );
}

export default App;