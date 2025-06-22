import React from 'react';
import PieChart from './charts/PieChart';

const categoryColors = [
  '#7F8CAA', // Muted Blue-Gray
  '#B8CFCE', // Light Teal-Gray
  '#A79AC3', // Muted Purple
  '#E59882', // Muted Salmon
  '#7EBC9F', // Muted Green
  '#F0C674', // Muted Gold
  '#81A1C1', // Muted Cornflower Blue
  '#B48EAD'  // Muted Mauve
];

function SpendingDashboard({ 
  categories, 
  isResetting, 
  onReset
}) {
  const grandTotal = categories.reduce((total, category) => total + (category.total_spent || 0), 0);

  return (
    <div className="spending-breakdown-card">
      <div className="category-header">
        <h2>Spending Breakdown</h2>
        <button onClick={onReset} className="reset-button" disabled={isResetting}>
          {isResetting ? 'Resetting...' : 'Reset All'}
        </button>
      </div>
      
      <div className="chart-section">
        <PieChart categories={categories} colors={categoryColors} />
      </div>
      
      <div className="categories-list">
        <ul>
          {categories.map((cat, index) => (
            <li key={cat.id}>
              <div className="category-list-item">
                <span 
                  className="category-color-circle"
                  style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                ></span>
                <span>{cat.name}</span>
              </div>
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

export default SpendingDashboard; 