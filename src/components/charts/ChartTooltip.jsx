import React, { useLayoutEffect, useRef } from 'react';
import './ChartTooltip.css';

const GAP = 14;

const ChartTooltip = ({ title, rows = [] }) => {
  const rootRef = useRef(null);
  const stateRef = useRef({ appliedX: 0, appliedY: 0, lastTransform: null });

  // Quadrant placement: position the modal fully above/below AND right/left of
  // the anchor (never over the cursor/bubble), chosen by available space, and
  // move nivo's positioned WRAPPER itself so nothing overflows the card
  // (which is what created the scrollbar).
  useLayoutEffect(() => {
    const tip = rootRef.current;
    if (!tip) return;

    // Locate the positioned wrapper nivo renders us inside.
    let wrapper = tip.parentElement;
    while (wrapper && wrapper !== document.body) {
      const cs = getComputedStyle(wrapper);
      if ((cs.transform && cs.transform !== 'none') || cs.position === 'absolute' || cs.position === 'fixed') break;
      wrapper = wrapper.parentElement;
    }
    if (!wrapper || wrapper === document.body) return;

    const st = stateRef.current;
    // If nivo rewrote the wrapper transform since our last pass, our delta is gone.
    if (wrapper.style.transform !== st.lastTransform) {
      st.appliedX = 0;
      st.appliedY = 0;
    }

    const readTranslate = () => {
      const t = getComputedStyle(wrapper).transform;
      const m = /matrix\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)\s*\)/.exec(t);
      if (m) return { x: parseFloat(m[5]), y: parseFloat(m[6]) };
      return { x: parseFloat(wrapper.style.left) || 0, y: parseFloat(wrapper.style.top) || 0 };
    };

    const setTranslate = (x, y) => {
      wrapper.style.transform = `translate(${x}px, ${y}px)`;
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      st.lastTransform = wrapper.style.transform;
    };

    // 1) Revert to nivo's raw placement for a clean measurement.
    const cur = readTranslate();
    const rawX = cur.x - st.appliedX;
    const rawY = cur.y - st.appliedY;
    setTranslate(rawX, rawY);

    // 2) Measure raw anchor + modal size.
    const rawRect = tip.getBoundingClientRect();
    const host = tip.closest('.u-container') || tip.closest('.glass') || document.documentElement;
    const hostRect = host.getBoundingClientRect();
    const w = rawRect.width;
    const h = rawRect.height;
    const ax = rawRect.left;
    const ay = rawRect.top;

    // 3) Choose quadrant: right else left, below else above.
    const spaceRight = hostRect.right - ax;
    const spaceBelow = hostRect.bottom - ay;
    let posX = spaceRight >= w + GAP * 2 ? ax + GAP : ax - w - GAP;
    let posY = spaceBelow >= h + GAP * 2 ? ay + GAP : ay - h - GAP;

    // Safety clamp inside the card.
    posX = Math.min(Math.max(posX, hostRect.left + 4), Math.max(hostRect.left + 4, hostRect.right - w - 4));
    posY = Math.min(Math.max(posY, hostRect.top + 4), Math.max(hostRect.top + 4, hostRect.bottom - h - 4));

    // 4) Move the wrapper by the delta so the modal lands in the quadrant
    //    and no overflow (scrollbar) can occur.
    const dx = posX - rawRect.left;
    const dy = posY - rawRect.top;
    setTranslate(rawX + dx, rawY + dy);
    st.appliedX = dx;
    st.appliedY = dy;
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