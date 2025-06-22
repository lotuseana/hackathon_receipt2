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

function PieChart({ categories, colors }) {
  const nonZeroCategories = categories.filter(cat => (cat.total_spent || 0) > 0);
  const totalSpent = nonZeroCategories.reduce((sum, cat) => sum + (cat.total_spent || 0), 0);

  const hasData = nonZeroCategories.length > 0;

  const data = {
    labels: hasData ? nonZeroCategories.map(cat => cat.name) : ['No spending data'],
    datasets: [{
      data: hasData ? nonZeroCategories.map(cat => cat.total_spent || 0) : [1],
      backgroundColor: hasData
        ? nonZeroCategories.map(cat => colors[categories.findIndex(c => c.id === cat.id) % colors.length])
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
        display: false,
      },
      tooltip: {
        enabled: hasData,
        backgroundColor: '#333446',
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
      animateScale: false,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="pie-chart-container">
      <h3>Spending Breakdown</h3>
      <div className="chart-wrapper">
        <div className="chart-container">
          <Doughnut data={data} options={options} />
          <div className="center-total">
            <div className="total-amount">${totalSpent.toFixed(2)}</div>
            <div className="total-label">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PieChart; 
