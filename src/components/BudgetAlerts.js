import React from 'react';

function BudgetAlerts({ budgetAlerts, onDismiss }) {
  if (!budgetAlerts || budgetAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getAlertClass = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return 'alert-critical';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className="budget-alerts-container">
      <h3>Budget Alerts</h3>
      <div className="alerts-list">
        {budgetAlerts.map((alert, index) => (
          <div 
            key={index} 
            className={`budget-alert ${getAlertClass(alert.alert_level)}`}
          >
            <div className="alert-icon">
              {getAlertIcon(alert.alert_level)}
            </div>
            <div className="alert-content">
              <div className="alert-category">
                {alert.category_name}
              </div>
              <div className="alert-message">
                {alert.is_over_budget ? (
                  `You're ${Math.abs(alert.progress_percentage - 100).toFixed(1)}% over your budget!`
                ) : (
                  `You're ${alert.progress_percentage.toFixed(1)}% through your budget`
                )}
              </div>
              <div className="alert-details">
                <span>Budget: ${alert.budget_amount.toFixed(2)}</span>
                <span>Spent: ${alert.spent_amount.toFixed(2)}</span>
                {!alert.is_over_budget && (
                  <span>Remaining: ${alert.remaining_amount.toFixed(2)}</span>
                )}
              </div>
            </div>
            {onDismiss && (
              <button 
                onClick={() => onDismiss(index)}
                className="dismiss-alert-button"
                title="Dismiss alert"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BudgetAlerts; 