import React from 'react';
import './ChartLegend.css';

const ChartLegend = ({ items = [] }) => (
  <div className="chart-legend">
    {items.map((item) => (
      <span className="chart-legend-item" key={item.label}>
        <span
          className="chart-legend-dot"
          style={{ '--legend-dot-color': item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
);

export default ChartLegend;