import React from 'react';
import './ChartTooltip.css';

const ChartTooltip = ({ title, rows = [] }) => (
  <div className="chart-tooltip">
    <div className="chart-tooltip__title">{title}</div>
    {rows.length > 0 && (
      <div className="chart-tooltip__rows">
        {rows.map((row, i) => (
          <div key={i} className="chart-tooltip__row">
            <span className="chart-tooltip__label">{row.label}:</span>
            <span className="chart-tooltip__value">{row.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ChartTooltip;