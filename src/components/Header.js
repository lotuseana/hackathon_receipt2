import React from 'react';

function Header({ user, onSignOut, onManageBudgets }) {
  return (
    <div className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/budgie.png" alt="Budgie Logo" style={{ height: '40px', width: '40px', objectFit: 'contain', marginRight: '8px' }} />
        <h1 style={{ margin: 0 }}>Budgie</h1>
      </div>
      <div className="user-info">
        <span style={{
          fontSize: '1.1em',
          color: '#27ae60',
          background: '#eafaf1',
          padding: '6px 16px',
          borderRadius: '16px',
          fontWeight: 600,
          marginLeft: '10px',
          boxShadow: '0 1px 4px rgba(39,174,96,0.07)'
        }}>
          Welcome, {user.email}!
        </span>
        <button onClick={onManageBudgets} className="manage-budgets-button">
          Manage Budgets
        </button>
        <button onClick={onSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Header; 