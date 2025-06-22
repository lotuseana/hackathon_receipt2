import React, { useState } from 'react';

function ManualEntry({ categories, onAddEntry, isSubmitting = false }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory || !amount || !itemName) {
      setError('Please fill out all fields.');
      return;
    }
    setError('');
    onAddEntry({
      category: selectedCategory,
      total: parseFloat(amount),
      name: itemName,
    });
    setSelectedCategory('');
    setAmount('');
    setItemName('');
  };

  return (
    <div className="manual-entry-card">
      <h3>Add a Manual Entry</h3>
      <form onSubmit={handleSubmit} className="manual-entry-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="" disabled>Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="item-name-input">Item Name</label>
            <input
              id="item-name-input"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Coffee"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount-input">Amount</label>
            <input
              id="amount-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              min="0"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <button 
          type="submit" 
          className="add-entry-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Spending'}
        </button>
        {error && <p className="error-message-small">{error}</p>}
      </form>
    </div>
  );
}

export default ManualEntry; 