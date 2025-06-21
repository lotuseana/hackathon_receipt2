import React, { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import './App.css';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
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
          content: `From the following receipt text, extract the store name, date, a list of items with their prices, and the final total. Please return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json. If you cannot find a value for a field, use null or an empty array for items. The JSON object must have these keys: "storeName", "date", "items", "total".\n\nReceipt Text:\n${text}`
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
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Receipt Budget Assistant</h1>
      <input 
        type="file" 
        accept="image/png, image/jpeg" 
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
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <p>Error: {error}</p>
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