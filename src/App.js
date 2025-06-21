import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setOcrText('');
  };

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setOcrText('');
    
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(selectedFile);
    await worker.terminate();

    setOcrText(text);
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
            {isLoading ? 'Processing...' : 'Extract Text'}
          </button>
        </div>
      )}
      {ocrText && (
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