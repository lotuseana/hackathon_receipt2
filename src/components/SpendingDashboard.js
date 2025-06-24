import React, { useState, useEffect, useRef } from 'react';
import PieChart from './charts/PieChart';

const categoryColors = [
  '#F6EFC7', // Soft Pastel Yellow
  '#BEE3E0', // Soft Pastel Aqua
  '#C7E8CA', // Soft Pastel Mint
  '#C9D8F6', // Soft Pastel Blue
  '#F9E0C7', // Soft Pastel Peach
  '#F6D1D5', // Soft Pastel Pink
  '#D8EAD3', // Soft Pastel Green
  '#F7E6A9'  // Muted Budgie Yellow
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
  const [skipResetAnimation, setSkipResetAnimation] = useState(false);
  const [popupPosition, setPopupPosition] = useState(null); // {top, left}
  const [pendingPopupRect, setPendingPopupRect] = useState(null); // for post-measurement adjustment
  const popupRef = useRef(null);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract'


  useEffect(() => {
    function handleBlur() {
      if (isResetting) {
        setSkipResetAnimation(true);
      }
    }
    function handleFocus() {
      setSkipResetAnimation(false);
    }
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isResetting]);

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

  const handleEditClick = (category, event) => {
    setEditingId(category.id);
    setEditValue('');
    setUpdateError(null);
    setAdjustmentType('add');
    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();
      setPendingPopupRect({
        top: rect.bottom + window.scrollY + 6,
        right: rect.right + window.scrollX - 6, // use right edge for leftward popup
      });
    } else {
      setPendingPopupRect(null);
    }
  };

  useEffect(() => {
    if (pendingPopupRect && editingId && popupRef.current) {
      const popupWidth = popupRef.current.offsetWidth;
      let left = pendingPopupRect.right - popupWidth;
      // Prevent overflow off the left edge
      if (left < 8) left = 8;
      setPopupPosition({
        top: pendingPopupRect.top,
        left,
      });
      setPendingPopupRect(null);
    }
  }, [pendingPopupRect, editingId]);

  const handleSave = async (categoryId) => {
    if (!onUpdateCategory) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      let adjustment = parseFloat(editValue) || 0;
      if (adjustment < 0) adjustment = Math.abs(adjustment);
      if (adjustmentType === 'subtract') adjustment = -adjustment;
      const currentCategory = categories.find(cat => cat.id === categoryId);
      const currentAmount = currentCategory ? currentCategory.total_spent || 0 : 0;
      const newAmount = currentAmount + adjustment;
      if (newAmount < 0) {
        throw new Error("Adjustment would result in negative amount");
      }
      await onUpdateCategory(categoryId, newAmount, adjustment);
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
    setPopupPosition(null);
    setPendingPopupRect(null);
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === 'Enter') {
      handleSave(categoryId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };


  const getProgressForCategory = (categoryId) => {
    return budgetProgress.find(progress => 
      budgets.find(budget => budget.id === progress.budget_id)?.category_id === categoryId
    );
  };


  // Inline popup component
  function InlinePopup({ isOpen, position, pendingRect, onClose, children }) {
    // If position is not set but pendingRect is, use fallback width
    let style = {};
    if (position) {
      style = {
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1001,
        minWidth: 260,
        maxWidth: '90vw',
      };
    } else if (pendingRect) {
      // Fallback: use minWidth (260px) for initial render
      let left = pendingRect.right - 260;
      if (left < 8) left = 8;
      style = {
        position: 'absolute',
        top: pendingRect.top,
        left,
        zIndex: 1001,
        minWidth: 260,
        maxWidth: '90vw',
      };
    } else {
      return null;
    }
    return (
      <div>
        <div
          className="popup-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            background: 'transparent',
          }}
        />
        <div
          className="inline-popup-content"
          ref={popupRef}
          style={style}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="spending-breakdown-card">
      <div className="category-header">
        <h2>Spending Breakdown</h2>
      </div>
      
      <div className="dashboard-content">
        <div className="chart-section">
          <PieChart categories={categories} colors={categoryColors} />
          <button onClick={onReset} className="reset-button" disabled={isResetting} 
            style={skipResetAnimation ? { transition: 'none' } : {}}>
            {isResetting ? 'Resetting...' : 'Reset All'}
          </button>
        </div>
        
        <div className="categories-list">
          <ul>
            {categories.map((cat, index) => {
              const progress = getProgressForCategory(cat.id);
              const categoryAmount = cat.total_spent || 0;
              const progressPercentage = progress ? Math.min(progress.progress_percentage, 100) : 0;
              
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
                    
                    <div className="amount-display">
                      <strong>${categoryAmount.toFixed(2)}</strong>
                      <button
                        onClick={e => handleEditClick(cat, e)}
                        className="edit-button"
                        title="Edit amount"
                        type="button"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  {/* Budget Progress Bar - Always visible, shows budget progress */}
                  <div className="category-spending-progress">
                    <div className="progress-bar-container-category" style={{position: 'relative'}}>
                      {/* Colored fill only if progress > 0 */}
                      {progressPercentage > 0 && (
                        <div 
                          className="progress-bar-category"
                          style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: progress && progress.is_over_budget ? '#e74c3c' : categoryColors[index % categoryColors.length],
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            height: '100%',
                            zIndex: 1
                          }}
                        />
                      )}
                      {/* Percentage text removed */}
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
      {/* Inline popup for category adjustment */}
      <InlinePopup isOpen={!!editingId} position={popupPosition} pendingRect={pendingPopupRect} onClose={handleCancel}>
        {editingId && (() => {
          const cat = categories.find(c => c.id === editingId);
          if (!cat) return null;
          const categoryAmount = cat.total_spent || 0;
          return (
            <div className="edit-amount-modal-container">
              <h3>Adjust {cat.name} Spending</h3>
              <div className="current-amount-display">
                <span className="current-label">Current: ${categoryAmount.toFixed(2)}</span>
              </div>
              <div className="adjustment-input-group">
                <label className="adjustment-label">Adjustment:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={`adjustment-type-toggle${adjustmentType === 'add' ? ' active' : ''}`}
                    onClick={() => setAdjustmentType('add')}
                    disabled={isUpdating}
                    aria-pressed={adjustmentType === 'add'}
                    style={{
                      background: adjustmentType === 'add' ? '#4CAF50' : '#ECEFF1',
                      color: adjustmentType === 'add' ? '#fff' : '#333446',
                      border: 'none',
                      borderRadius: '6px 0 0 6px',
                      padding: '8px 14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      fontSize: '1.1rem',
                      transition: 'background 0.2s',
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={`adjustment-type-toggle${adjustmentType === 'subtract' ? ' active' : ''}`}
                    onClick={() => setAdjustmentType('subtract')}
                    disabled={isUpdating}
                    aria-pressed={adjustmentType === 'subtract'}
                    style={{
                      background: adjustmentType === 'subtract' ? '#e74c3c' : '#ECEFF1',
                      color: adjustmentType === 'subtract' ? '#fff' : '#333446',
                      border: 'none',
                      borderRadius: '0 6px 6px 0',
                      padding: '8px 14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      fontSize: '1.1rem',
                      transition: 'background 0.2s',
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, cat.id)}
                    step="0.01"
                    className="edit-amount-input"
                    disabled={isUpdating}
                    autoFocus
                    placeholder="0.00"
                    style={{ width: 100, marginLeft: 4 }}
                  />
                </div>
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
              {updateError && (
                <div className="error-message">
                  <p>Error: {updateError}</p>
                </div>
              )}
            </div>
          );
        })()}
      </InlinePopup>
    </div>
  );
}

export default SpendingDashboard; 