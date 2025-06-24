import React, { useState, useRef } from 'react';

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
  const editAmountRef = useRef(null);
  
  const [creatingForCategory, setCreatingForCategory] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = (budget) => {
    setEditingBudget(budget);
    setEditAmount(budget.budget_amount.toString());
    setError(null);
    setTimeout(() => {
      if (editAmountRef.current) {
        const el = editAmountRef.current;
        el.focus();
        // Place caret at the end
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  };

  const handleEditAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleEditAmountBlur = () => {
    // Sanitize the value before saving
    setEditAmount((prev) => prev.replace(/[^\d.]/g, ''));
    handleSave();
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
      
      await onUpdateBudget(editingBudget.id, amount);
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

  const handleCreateClick = (categoryId) => {
    setCreatingForCategory(categoryId);
    setNewAmount('');
    setError(null);
  };

  const handleCancelCreate = () => {
    setCreatingForCategory(null);
    setError(null);
  };

  const handleSaveNewBudget = async () => {
    if (!creatingForCategory || !newAmount) return;
    
    setIsUpdating(true);
    setError(null);

    try {
      const amount = parseFloat(newAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      await onCreateBudget(creatingForCategory, amount);
      setCreatingForCategory(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
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

  return (
    <div className="budget-management-card">
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
                    {editingBudget?.id === budget.id ? (
                      <span>
                        <input
                          ref={editAmountRef}
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          onKeyDown={handleEditAmountKeyDown}
                          onBlur={handleEditAmountBlur}
                          className="edit-budget-input edit-budget-input--no-spinner"
                          style={{
                            minWidth: '10px',
                            maxWidth: '60px',
                            display: 'inline-block',
                            outline: 'none',
                            border: 'none',
                            borderBottom: '1.5px dotted #2980b9',
                            borderRadius: 0,
                            background: '#eaf6ff',
                            padding: '2px 0',
                            fontSize: 'inherit',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            color: '#2980b9',
                            appearance: 'textfield',
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                          }}
                          disabled={isUpdating}
                          autoFocus
                          step="0.01"
                          min="0"
                        />
                        <span style={{ color: 'inherit', textDecoration: 'none', marginLeft: 8 }}>
                          monthly
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span
                          className="budget-amount"
                          style={{ cursor: 'pointer', textDecoration: 'underline dotted', color: '#2980b9' }}
                          title="Click to edit budget"
                          onClick={() => handleEditClick(budget)}
                          onMouseOver={e => { e.target.style.background = '#f0f8ff'; }}
                          onMouseOut={e => { e.target.style.background = 'none'; }}
                        >
                          ${budget.budget_amount.toFixed(2)}
                        </span>
                        <span style={{ color: 'inherit', textDecoration: 'none', marginLeft: 8 }}>
                          monthly
                        </span>
                      </span>
                    )}
                  </div>
                  
                  {progress && (
                    <div className="budget-progress">
                      <div className="progress-bar-container" style={{
                        border: progress.is_over_budget ? '2px solid #e74c3c' : undefined,
                        borderRadius: '8px',
                      }}>
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
                          {progress.progress_percentage.toFixed(1)}% used
                        </span>
                        {progress.is_over_budget ? (
                          <span className="progress-amount-remaining over-budget" style={{ marginLeft: '12px', color: '#e74c3c', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2em', marginRight: 4 }} title="Over budget">⚠️</span>
                            ${Math.abs(progress.remaining_amount).toFixed(2)} over budget.
                          </span>
                        ) : (
                          <span className="progress-amount-remaining" style={{ marginLeft: '12px' }}>
                            ${progress.remaining_amount.toFixed(2)} remaining in your budget.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-budget">
                  {creatingForCategory === category.id ? (
                    <div className="edit-budget-form">
                      <input
                        type="number"
                        placeholder="Monthly Budget"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="edit-budget-input"
                        disabled={isUpdating}
                      />
                      <button
                        onClick={handleSaveNewBudget}
                        disabled={isUpdating}
                        className="save-budget-button"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelCreate}
                        disabled={isUpdating}
                        className="cancel-budget-button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p>No budget set for this category</p>
                      <button
                        onClick={() => handleCreateClick(category.id)}
                        className="create-budget-button"
                        disabled={isLoading}
                      >
                        Set Budget
                      </button>
                    </>
                  )}
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