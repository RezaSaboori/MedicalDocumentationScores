import React, { useLayoutEffect, useRef } from 'react';
import './ChartTooltip.css';

const ChartTooltip = ({ title, rows = [] }) => {
  const rootRef = useRef(null);

  // Keeps the floating modal inside its chart container on every render.
  // nivo positions its tooltip wrapper with a raw translate() and no bounds
  // checking; on an RTL page that clips the modal and spawns scrollbars.
  // After each render we measure ourselves and shift the wrapper back inside
  // (i.e. the modal flips below / to-the-right of the anchor near edges).
  useLayoutEffect(() => {
    const tip = rootRef.current;
    if (!tip) return;

    // Find the positioned wrapper nivo renders us inside (inline transform/left).
    let wrapper = tip.parentElement;
    while (wrapper && wrapper !== document.body) {
      const s = wrapper.style;
      if (s && (s.transform || s.left || s.top)) break;
      wrapper = wrapper.parentElement;
    }
    if (!wrapper || wrapper === document.body) return;

    const host = wrapper.offsetParent || wrapper.parentElement || document.body;
    const hostRect = host.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const pad = 4;

    let dx = 0;
    let dy = 0;
    if (tipRect.right > hostRect.right - pad) dx = hostRect.right - pad - tipRect.right;
    if (tipRect.left + dx < hostRect.left + pad) dx = hostRect.left + pad - tipRect.left;
    if (tipRect.bottom > hostRect.bottom - pad) dy = hostRect.bottom - pad - tipRect.bottom;
    if (tipRect.top + dy < hostRect.top + pad) dy = hostRect.top + pad - tipRect.top;

    if (!dx && !dy) return;

    const m = /translate\(\s*([^,)]+?)(?:px)?\s*,\s*([^)]+?)(?:px)?\s*\)/.exec(wrapper.style.transform || '');
    if (m) {
      const x = parseFloat(m[1]) + dx;
      const y = parseFloat(m[2]) + dy;
      wrapper.style.transform = `translate(${x}px, ${y}px)`;
    } else {
      wrapper.style.left = `${(parseFloat(wrapper.style.left) || 0) + dx}px`;
      wrapper.style.top = `${(parseFloat(wrapper.style.top) || 0) + dy}px`;
    }
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