import React, { useLayoutEffect, useRef } from 'react';
import './ChartTooltip.css';

const ChartTooltip = ({ title, rows = [] }) => {
  const rootRef = useRef(null);

  // Self-clamping: measure our own rect and shift ourselves back inside the
  // chart card (and viewport) whenever nivo's raw placement overflows an edge.
  // Near the top edge the modal flips below the cursor, near the left edge it
  // flips to the right — and it can never extend the scroll area again.
  // Works independently of the installed nivo version's wrapper internals.
  useLayoutEffect(() => {
    const tip = rootRef.current;
    if (!tip) return;

    // Reset any previous shift so the measurement is the raw placement.
    tip.style.position = 'relative';
    tip.style.left = '0px';
    tip.style.top = '0px';

    const tipRect = tip.getBoundingClientRect();
    const host =
      tip.closest('.u-container') ||
      tip.closest('.glass') ||
      document.documentElement;
    const hostRect = host.getBoundingClientRect();
    const pad = 6;

    let dx = 0;
    let dy = 0;

    // Keep inside the chart card.
    if (tipRect.right > hostRect.right - pad) dx = hostRect.right - pad - tipRect.right;
    if (tipRect.left + dx < hostRect.left + pad) dx = hostRect.left + pad - tipRect.left;
    if (tipRect.bottom > hostRect.bottom - pad) dy = hostRect.bottom - pad - tipRect.bottom;
    if (tipRect.top + dy < hostRect.top + pad) dy = hostRect.top + pad - tipRect.top;

    // Then never leave the viewport.
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (tipRect.right + dx > vw - pad) dx = vw - pad - tipRect.right;
    if (tipRect.left + dx < pad) dx = pad - tipRect.left;
    if (tipRect.bottom + dy > vh - pad) dy = vh - pad - tipRect.bottom;
    if (tipRect.top + dy < pad) dy = pad - tipRect.top;

    tip.style.left = `${dx}px`;
    tip.style.top = `${dy}px`;
  });

  return (
    <div className="chart-tooltip" ref={rootRef}>
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
};

export default ChartTooltip;