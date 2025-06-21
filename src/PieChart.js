import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function PieChart({ categories }) {
  // Filter out categories with zero spending
  const nonZeroCategories = categories.filter(cat => (cat.total_spent || 0) > 0);
  
  if (nonZeroCategories.length === 0) {
    return (
      <div className="pie-chart-container">
        <h3>Spending Breakdown</h3>
        <p className="no-data">No spending data available</p>
      </div>
    );
  }

  const data = {
    labels: nonZeroCategories.map(cat => cat.name),
    datasets: [{
      data: nonZeroCategories.map(cat => cat.total_spent || 0),
      backgroundColor: [
        '#333446',
        '#7F8CAA', 
        '#B8CFCE',
        '#EAEFEF',
        '#A8B5C4',
        '#D4E4E6',
        '#C5D1E8',
        '#E8F0F2'
      ],
      borderColor: '#333446',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverBorderColor: '#7F8CAA'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#333446'
        }
      },
      tooltip: {
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
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="pie-chart-container">
      <h3>Spending Breakdown</h3>
      <div className="chart-wrapper">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

export default PieChart; 