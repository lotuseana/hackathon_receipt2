import React from 'react';

function SideMenu({ isOpen, onClose, children }) {
  return (
    <div>
      <div 
        className={`side-menu-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      ></div>
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <button onClick={onClose} className="close-menu-button">
            &times;
          </button>
        </div>
        <div className="side-menu-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SideMenu; 