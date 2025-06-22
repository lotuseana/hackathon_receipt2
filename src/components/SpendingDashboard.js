import React, { useState } from 'react';
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
  onReset,
  onUpdateCategory
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const grandTotal = categories.reduce((total, category) => total + (category.total_spent || 0), 0);

  const handleEditClick = (category) => {
    setEditingId(category.id);
    setEditValue(''); // Start with empty input for adjustment
    setUpdateError(null);
  };

  const handleSave = async (categoryId) => {
    if (!onUpdateCategory) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const adjustment = parseFloat(editValue) || 0;
      const currentCategory = categories.find(cat => cat.id === categoryId);
      const currentAmount = currentCategory ? currentCategory.total_spent || 0 : 0;
      const newAmount = currentAmount + adjustment;
      
      if (newAmount < 0) {
        throw new Error("Adjustment would result in negative amount");
      }
      
      await onUpdateCategory(categoryId, newAmount);
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setUpdateError(null);
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === 'Enter') {
      handleSave(categoryId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

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
              {editingId === cat.id ? (
                <div className="edit-amount-container">
                  <div className="current-amount-display">
                    <span className="current-label">Current: ${(cat.total_spent || 0).toFixed(2)}</span>
                  </div>
                  <div className="adjustment-input-group">
                    <label className="adjustment-label">Adjustment (+/-):</label>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, cat.id)}
                      step="0.01"
                      className="edit-amount-input"
                      disabled={isUpdating}
                      autoFocus
                      placeholder="0.00"
                    />
                  </div>
                  <div className="edit-buttons">
                    <button
                      onClick={() => handleSave(cat.id)}
                      disabled={isUpdating}
                      className="save-button"
                    >
                      {isUpdating ? 'Saving...' : 'Apply'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="cancel-edit-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="amount-display">
                  <strong>${(cat.total_spent || 0).toFixed(2)}</strong>
                  <button
                    onClick={() => handleEditClick(cat)}
                    className="edit-button"
                    title="Edit amount"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {updateError && (
          <div className="error-message">
            <p>Error: {updateError}</p>
          </div>
        )}
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