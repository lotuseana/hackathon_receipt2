import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function PieChart({ categories }) {
  const nonZeroCategories = categories.filter(cat => (cat.total_spent || 0) > 0);
  const totalSpent = nonZeroCategories.reduce((sum, cat) => sum + (cat.total_spent || 0), 0);

  const hasData = nonZeroCategories.length > 0;

  const data = {
    labels: hasData ? nonZeroCategories.map(cat => cat.name) : ['No spending data'],
    datasets: [{
      data: hasData ? nonZeroCategories.map(cat => cat.total_spent || 0) : [1],
      backgroundColor: hasData
        ? [
            '#333446', '#7F8CAA', '#B8CFCE', '#EAEFEF',
            '#A8B5C4', '#D4E4E6', '#C5D1E8', '#E8F0F2'
          ]
        : ['#EAEFEF'],
      borderColor: hasData ? '#333446' : '#B8CFCE',
      borderWidth: hasData ? 2 : 1,
      hoverBorderWidth: hasData ? 3 : 1,
      hoverBorderColor: hasData ? '#7F8CAA' : '#B8CFCE'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: hasData,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          color: '#333446'
        }
      },
      tooltip: {
        enabled: hasData,
        backgroundColor: 'rgba(51, 52, 70, 0.9)',
        titleColor: '#EAEFEF',
        bodyColor: '#EAEFEF',
        borderColor: '#B8CFCE',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: hasData,
      animateScale: hasData,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="pie-chart-container">
      <h3>Spending Breakdown</h3>
      <div className="chart-wrapper">
        <div className="chart-container">
          <div className="center-total">
            <div className="total-amount">${totalSpent.toFixed(2)}</div>
            <div className="total-label">Total Spent</div>
          </div>
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default PieChart; 