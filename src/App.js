import React, { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import './App.css';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setOcrText('');
    setStructuredData(null);
  };

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setOcrText('');
    setStructuredData(null);
    
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
        content: `Extract the store name, date, items with prices, and the total from the following receipt text. Return the response as a valid JSON object. Do not include any text outside of the JSON object.\n\nReceipt Text:\n${text}`
      }],
    });
    
    // The response from Anthropic is a string that should be valid JSON.
    // We will parse it to get the structured data object.
    const jsonData = JSON.parse(msg.content[0].text);
    setStructuredData(jsonData);
    setIsLoading(false);
  };

  return (
    <div className="App">
      <h1>Receipt Budget Assistant</h1>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect}
      />
      {selectedFile && (
        <div>
          <p>Selected: {selectedFile.name}</p>
          <button onClick={handleRecognize} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Extract & Analyze'}
          </button>
        </div>
      )}
      {structuredData && (
        <div>
          <h3>Structured Data:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(structuredData, null, 2)}
          </pre>
        </div>
      )}
      {ocrText && !structuredData && (
        <div>
          <h3>Extracted Text:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
            {ocrText}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;