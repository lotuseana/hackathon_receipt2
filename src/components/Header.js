import React from 'react';

function Header({ user, onSignOut, onManageBudgets }) {
  return (
    <div className="top-bar">
      <h1>Receipt Budget Assistant</h1>
      <div className="user-info">
        <span>Welcome, {user.email}</span>
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