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

  // Calculate budget progress for each category
  const getBudgetProgress = (categoryId) => {
    const budget = getBudgetForCategory(categoryId);
    const progress = getProgressForCategory(categoryId);
    if (!budget || !progress) return 0;
    return Math.min(progress.progress_percentage, 100);
  };

  return (
    <div className="spending-breakdown-card">
      <div className="category-header">
        <h2>Spending Breakdown</h2>
      </div>
      
      <div className="dashboard-content">
        <div className="chart-section">
          <PieChart categories={categories} colors={categoryColors} />
          <button onClick={onReset} className="reset-button" disabled={isResetting}>
            {isResetting ? 'Resetting...' : 'Reset All'}
          </button>
        </div>
        
        <div className="categories-list">
          <ul>
            {categories.map((cat, index) => {
              const budget = getBudgetForCategory(cat.id);
              const categoryAmount = cat.total_spent || 0;
              const budgetProgress = getBudgetProgress(cat.id);
              
              return (
                <li key={cat.id}>
                  <div className="category-details-container">
                    <div className="category-list-item">
                      <button 
                        onClick={() => handleToggleCategory(cat.id)} 
                        className="category-expand-button"
                        style={{ color: categoryColors[index % categoryColors.length] }}
                      >
                        {expandedCategoryId === cat.id ? '▼' : '▶'}
                      </button>
                      <span>{cat.name}</span>
                    </div>
                    
                    {editingId === cat.id ? (
                      <div className="edit-amount-container">
                        <div className="current-amount-display">
                          <span className="current-label">Current: ${categoryAmount.toFixed(2)}</span>
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
                        <strong>${categoryAmount.toFixed(2)}</strong>
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

                  {/* Budget Progress Bar - Always visible, shows budget progress */}
                  <div className="category-spending-progress">
                    <div className="progress-bar-container-category">
                      <div 
                        className="progress-bar-category"
                        style={{
                          width: `${budgetProgress}%`,
                          backgroundColor: categoryColors[index % categoryColors.length]
                        }}
                      >
                        {budget && budgetProgress > 0 && (
                          <span className="progress-text">
                            {budgetProgress.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedCategoryId === cat.id && (
                    <div className="spending-items-log">
                      {isItemsLoading ? (
                        <p>Loading items...</p>
                      ) : (
                        <ul>
                          {spendingItems.length > 0 ? (
                            spendingItems.map(item => (
                              <li key={item.id}>
                                <span className="item-name">{item.item_name}</span>
                                <div className="item-details">
                                  <span className="item-date">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="item-amount">${item.amount.toFixed(2)}</span>
                                </div>
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
        </div>
      </div>
    </div>
  );
}

export default SpendingDashboard; 