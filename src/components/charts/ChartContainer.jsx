import React, { useRef } from 'react';
import { downloadElementAsSvg } from '../../utils/svgExport';
import ChartLegend from './ChartLegend';
import './ChartContainer.css';

const ChartContainer = ({
  title,
  subtitle,
  legendItems = [],
  footerContent = null,
  className = '',
  children,
}) => {
  const panelRef = useRef(null);

  const handleDownload = async () => {
    try {
      await downloadElementAsSvg(panelRef.current, title);
    } catch (error) {
      console.error('Failed to export chart as PNG:', error);
    }
  };

  return (
    <section
      ref={panelRef}
      className={`glass u-container u-container--md chart-panel ${className}`.trim()}
    >
      <header className="chart-panel__header">
        <div className="chart-panel__heading">
          <h3 className="chart-panel__title">{title}</h3>

          {subtitle && (
            <p className="chart-panel__subtitle">{subtitle}</p>
          )}
        </div>

        <button
          type="button"
          className="chart-panel__download blue-glass"
          onClick={handleDownload}
          title="دانلود نمودار به صورت PNG"
          aria-label="دانلود نمودار به صورت PNG"
          data-export-ignore="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </header>

      <div className="chart-panel__body">
        {children}
      </div>

      <footer className="chart-panel__footer">
        {footerContent}

        <ChartLegend items={legendItems} />
      </footer>
    </section>
  );
};

export default ChartContainer;