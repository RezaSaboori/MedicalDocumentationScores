import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './ChartTooltip.css';

const GAP = 14;

// Global cursor tracker (passive, zero React overhead).
let lastMouse = { x: 0, y: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener(
    'mousemove',
    (e) => { lastMouse = { x: e.clientX, y: e.clientY }; },
    { passive: true }
  );
}

const ChartTooltip = ({ title, rows = [] }) => {
  const nodeRef = useRef(null);

  // Quadrant placement (right-down / left-down / right-up / left-up) done with
  // direct DOM writes batched in requestAnimationFrame: NO React state, NO
  // re-renders, NO layout thrash — it cannot affect loading or app speed.
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    let raf = 0;
    const place = () => {
      raf = 0;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = lastMouse.x + GAP;
      if (left + w > vw - 8) left = lastMouse.x - w - GAP;
      let top = lastMouse.y + GAP;
      if (top + h > vh - 8) top = lastMouse.y - h - GAP;
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };
    const onMove = () => { if (!raf) raf = requestAnimationFrame(place); };

    place();
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Portaled to <body>: fixed position + top z-index, out of every container's
  // flow — never enlarges a card, never creates a scrollbar.
  return ReactDOM.createPortal(
    <div className="chart-tooltip chart-tooltip--portal" ref={nodeRef}>
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
    </div>,
    document.body
  );
};

export default ChartTooltip;