import React, {
  useEffect,
  useRef,
} from 'react';
import { downloadElementAsSvg } from '../../utils/svgExport';
import {
  useDashboard,
} from '../../context/DashboardContext';
import {
  formatPeriodLabel,
} from '../../utils/period';
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
  const bodyRef = useRef(null);

  const {
    selectedPeriod,
  } = useDashboard();

  useEffect(() => {
    const panel =
      panelRef.current;

    const body =
      bodyRef.current;

    if (!panel || !body) {
      return undefined;
    }

    const syncScrollbarWidth =
      () => {
        const scrollbarWidth =
          Math.max(
            0,
            body.offsetWidth -
              body.clientWidth
          );

        panel.style.setProperty(
          '--chart-body-scrollbar-width',
          `${scrollbarWidth}px`
        );
      };

    syncScrollbarWidth();

    const observer =
      new ResizeObserver(
        syncScrollbarWidth
      );

    observer.observe(body);

    window.addEventListener(
      'resize',
      syncScrollbarWidth
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        'resize',
        syncScrollbarWidth
      );
    };
  }, []);

  const periodLabel =
    formatPeriodLabel(
      selectedPeriod
    );

  const displayTitle =
    typeof title === 'string' &&
    periodLabel
      ? `${title} - ${periodLabel}`
      : title;

  const handleDownload = async () => {
    try {
      await downloadElementAsSvg(
        panelRef.current,
        displayTitle
      );
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
        <button
          type="button"
          className="chart-panel__download frost-glass"
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

        <div className="chart-panel__heading">
          <h3 className="chart-panel__title">
            {displayTitle}
          </h3>

          {subtitle && (
            <p className="chart-panel__subtitle">{subtitle}</p>
          )}
        </div>


      </header>

      <div
        ref={bodyRef}
        className="chart-panel__body"
      >
        {children}
      </div>

      {(footerContent ||
        legendItems.length > 0) && (
        <footer className="chart-panel__footer">
          {footerContent}

          {legendItems.length > 0 && (
            <ChartLegend
              items={legendItems}
            />
          )}
        </footer>
      )}
    </section>
  );
};

export default ChartContainer;