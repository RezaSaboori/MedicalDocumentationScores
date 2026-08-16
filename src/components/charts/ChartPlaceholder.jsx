import React from 'react';
import './ChartPlaceholder.css';

const ChartPlaceholder = ({ title, height = '400px' }) => {
  return (
    <div 
      className="glass u-container u-container--md chart-placeholder" 
      style={{ minHeight: height }} // Unavoidable for dynamic prop-based sizing
    >
      <h3 className="chart-placeholder-title">{title}</h3>
      <p className="chart-placeholder-text">Chart Implementation Pending (Nivo/Visx)</p>
    </div>
  );
};

export default ChartPlaceholder;