import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setOcrText('');
    setProgress(0);

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker({
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(parseInt(m.progress * 100, 10));
        }
      },
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(selectedFile);
    setOcrText(text);
    setIsLoading(false);
    await worker.terminate();
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
            {isLoading ? `Processing... ${progress}%` : 'Extract Text'}
          </button>
        </div>
      )}
      {isLoading && <progress value={progress} max="100" />}
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