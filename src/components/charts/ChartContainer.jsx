import React from 'react';
import ChartLegend from './ChartLegend';
import './ChartContainer.css';

const ChartContainer = ({
  title,
  subtitle,
  legendItems = [],
  className = '',
  children,
}) => {
  return (
    <section
      className={`glass u-container u-container--md chart-panel ${className}`.trim()}
    >
      <header className="chart-panel__header">
        <h3 className="chart-panel__title">{title}</h3>
        {subtitle && (
          <p className="chart-panel__subtitle">{subtitle}</p>
        )}
      </header>

      <div className="chart-panel__body">
        {children}
      </div>

      <footer className="chart-panel__footer">
        <ChartLegend items={legendItems} />
      </footer>
    </section>
  );
};

export default ChartContainer;