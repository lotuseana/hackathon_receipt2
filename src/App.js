import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  return (
    <div className="App">
      <h1>Receipt Budget Assistant</h1>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect}
      />
      {selectedFile && <p>Selected: {selectedFile.name}</p>}
    </div>
  );
}

export default App;