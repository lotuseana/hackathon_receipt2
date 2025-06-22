import React from 'react';

function SpendingTips({ tips, onGenerate, isLoading, error }) {
  return (
    <div className="spending-tips-card">
      <h3>Smart Spending Tips</h3>
      <p className="tips-description">
        Get AI-powered insights based on your spending habits.
      </p>
      <button 
        className="generate-tips-button"
        onClick={onGenerate} 
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Get AI Tips'}
      </button>

      {error && <div className="error-message">{error}</div>}
      
      {tips && tips.length > 0 && (
        <ul className="spending-tips-list">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SpendingTips; 