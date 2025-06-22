import React, { useState } from 'react';

function BudgetManagement({ 
  categories, 
  budgets, 
  budgetProgress, 
  onUpdateBudget, 
  onCreateBudget, 
  onDeleteBudget,
  isLoading 
}) {
  const [editingBudget, setEditingBudget] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('monthly');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = (budget) => {
    setEditingBudget(budget);
    setEditAmount(budget.budget_amount.toString());
    setEditType(budget.budget_type);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingBudget || !editAmount) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const amount = parseFloat(editAmount);
      if (isNaN(amount) || amount < 0) {
        throw new Error("Please enter a valid amount");
      }
      
      await onUpdateBudget(editingBudget.id, amount, editType);
      setEditingBudget(null);
      setEditAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingBudget(null);
    setEditAmount('');
    setError(null);
  };

  const handleCreateBudget = async (categoryId) => {
    const amount = prompt("Enter budget amount:");
    if (!amount) return;
    
    const budgetAmount = parseFloat(amount);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    const budgetType = prompt("Enter budget type (weekly/monthly):", "monthly");
    if (!budgetType || !['weekly', 'monthly'].includes(budgetType.toLowerCase())) {
      setError("Please enter 'weekly' or 'monthly'");
      return;
    }
    
    try {
      await onCreateBudget(categoryId, budgetAmount, budgetType.toLowerCase());
    } catch (err) {
      setError(err.message);
    }
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

  const getAlertMessage = (progress) => {
    if (progress.is_over_budget) {
      return `You're ${Math.abs(progress.progress_percentage - 100).toFixed(1)}% over your ${progress.budget_type} budget!`;
    }
    
    switch (progress.alert_level) {
      case 'critical':
        return `You're ${progress.progress_percentage.toFixed(1)}% through your ${progress.budget_type} budget!`;
      case 'warning':
        return `You're ${progress.progress_percentage.toFixed(1)}% through your ${progress.budget_type} budget.`;
      case 'info':
        return `You've used ${progress.progress_percentage.toFixed(1)}% of your ${progress.budget_type} budget.`;
      default:
        return `You have ${progress.remaining_amount.toFixed(2)} remaining in your ${progress.budget_type} budget.`;
    }
  };

  return (
    <div className="budget-management-card">
      <h2>Smart Budget Tracking</h2>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <div className="budget-categories">
        {categories.map((category) => {
          const budget = budgets.find(b => b.category_id === category.id);
          const progress = budgetProgress.find(p => 
            budgets.find(b => b.id === p.budget_id)?.category_id === category.id
          );
          
          return (
            <div key={category.id} className="budget-category-item">
              <div className="category-header">
                <h3>{category.name}</h3>
                <div className="spent-amount">
                  Spent: <strong>${(category.total_spent || 0).toFixed(2)}</strong>
                </div>
              </div>
              
              {budget ? (
                <div className="budget-info">
                  <div className="budget-details">
                    <span className="budget-amount">
                      ${budget.budget_amount.toFixed(2)} {budget.budget_type}
                    </span>
                    {editingBudget?.id === budget.id ? (
                      <div className="edit-budget-form">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          className="edit-budget-input"
                          disabled={isUpdating}
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="edit-budget-type"
                          disabled={isUpdating}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <button
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="save-budget-button"
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isUpdating}
                          className="cancel-budget-button"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="budget-actions">
                        <button
                          onClick={() => handleEditClick(budget)}
                          className="edit-budget-button"
                          title="Edit budget"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteBudget(budget.id)}
                          className="delete-budget-button"
                          title="Delete budget"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {progress && (
                    <div className="budget-progress">
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar"
                          style={{
                            width: `${getProgressBarWidth(progress.progress_percentage)}%`,
                            backgroundColor: getProgressBarColor(progress.alert_level)
                          }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <span className="progress-percentage">
                          {progress.progress_percentage.toFixed(1)}%
                        </span>
                        <span className="progress-message">
                          {getAlertMessage(progress)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-budget">
                  <p>No budget set for this category</p>
                  <button
                    onClick={() => handleCreateBudget(category.id)}
                    className="create-budget-button"
                    disabled={isLoading}
                  >
                    Set Budget
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetManagement; 