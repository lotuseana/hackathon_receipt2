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
  onUpdateCategory,
  budgets = [],
  budgetProgress = [],
  fetchSpendingItems,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [spendingItems, setSpendingItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  const grandTotal = categories.reduce((total, category) => total + (category.total_spent || 0), 0);

  const handleToggleCategory = async (categoryId) => {
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      setSpendingItems([]);
    } else {
      setExpandedCategoryId(categoryId);
      setIsItemsLoading(true);
      const items = await fetchSpendingItems(categoryId);
      setSpendingItems(items);
      setIsItemsLoading(false);
    }
  };

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

  const getBudgetForCategory = (categoryId) => {
    return budgets.find(budget => budget.category_id === categoryId);
  };

  const getProgressForCategory = (categoryId) => {
    return budgetProgress.find(progress => 
      budgets.find(budget => budget.id === progress.budget_id)?.category_id === categoryId
    );
  };

  const getProgressBarColor = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      case 'info':
        return '#3498db';
      default:
        return '#27ae60';
    }
  };

  const getProgressBarWidth = (progress) => {
    return Math.min(progress, 100);
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
          {categories.map((cat, index) => {
            const budget = getBudgetForCategory(cat.id);
            const progress = getProgressForCategory(cat.id);
            
            return (
              <li key={cat.id}>
                <div className="category-details-container">
                  <div className="category-list-item">
                    <span 
                      className="category-color-circle"
                      style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                    ></span>
                    <button onClick={() => handleToggleCategory(cat.id)} className="category-expand-button">
                      {expandedCategoryId === cat.id ? '▼' : '▶'}
                    </button>
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
                      {progress && (
                        <span className="progress-percentage-mini">
                          ({progress.progress_percentage.toFixed(1)}% of budget)
                        </span>
                      )}
                      <button
                        onClick={() => handleEditClick(cat)}
                        className="edit-button"
                        title="Edit amount"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>

                {/* Budget Progress Bar */}
                {budget && progress && !isItemsLoading && (
                  <div className="budget-progress-mini">
                    <div className="progress-bar-container-mini">
                      <div 
                        className="progress-bar-mini"
                        style={{
                          width: `${getProgressBarWidth(progress.progress_percentage)}%`,
                          backgroundColor: getProgressBarColor(progress.alert_level)
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {expandedCategoryId === cat.id && (
                  <div className="spending-items-log">
                    {isItemsLoading ? (
                      <p>Loading items...</p>
                    ) : (
                      <ul>
                        {spendingItems.length > 0 ? (
                          spendingItems.map(item => (
                            <li key={item.id}>
                              <span>{item.item_name}</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </li>
                          ))
                        ) : (
                          <li>No items found for this category.</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
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