import React from 'react';
import './ChartTooltip.css';

const ChartTooltip = ({ title, rows = [] }) => (
  <div className="chart-tooltip">
    <strong className="chart-tooltip-title">{title}</strong>
    {rows.map((row) => (
      <span className="chart-tooltip-row" key={row.label}>
        {row.label}: {row.value}
      </span>
    ))}
  </div>
);

export default ChartTooltip;