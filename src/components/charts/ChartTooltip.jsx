import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './ChartTooltip.css';

const GAP = 14;

// Global cursor tracker so the portal knows the cursor position from the
// very first frame (nivo does not pass the mouse event to tooltip content).
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
  const [mouse, setMouse] = useState(lastMouse);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (el && (el.offsetWidth !== size.w || el.offsetHeight !== size.h)) {
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    }
  });

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Quadrant placement around the cursor:
  // default Right-Down; flip Left-Down near the right edge;
  // flip Right-Up near the bottom edge; Left-Up at the bottom-right corner.
  let left = mouse.x + GAP;
  if (left + size.w > vw - 8) left = mouse.x - size.w - GAP;
  let top = mouse.y + GAP;
  if (top + size.h > vh - 8) top = mouse.y - size.h - GAP;
  left = Math.max(8, Math.min(left, Math.max(8, vw - size.w - 8)));
  top = Math.max(8, Math.min(top, Math.max(8, vh - size.h - 8)));

  // Portaled to <body> with fixed positioning: it can never enlarge a chart
  // card, never create a scrollbar, and always floats above everything.
  return ReactDOM.createPortal(
    <div
      className="chart-tooltip chart-tooltip--portal"
      ref={nodeRef}
      style={{ left: `${left}px`, top: `${top}px` }}
    >
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