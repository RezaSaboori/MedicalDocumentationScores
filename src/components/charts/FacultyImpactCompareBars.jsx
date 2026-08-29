import React from 'react';

const defaultFmt = (v) => {
  const n = Number(v || 0);
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
};

const FacultyImpactCompareBars = ({ items, mode = 'diverging', formatter = defaultFmt }) => {
  const usable = items.filter(it => it.value !== null && it.value !== undefined);
  if (!usable.length) return null;

  const maxAbs = Math.max(...usable.map(i => Math.abs(i.value || 0)), 0.0001);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {usable.map(it => {
        const v = it.value;
        const positive = v >= 0;
        const widthPct = mode === 'diverging' ? (Math.abs(v) / maxAbs) * 50 : (Math.abs(v) / maxAbs) * 100;
        const inside = widthPct >= (mode === 'diverging' ? 18 : 12);
        const color = it.color || (positive ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)');

        let barStyle;
        let labelStyle;
        if (mode === 'diverging') {
          barStyle = positive
            ? { left: '50%', width: `${widthPct}%`, borderRadius: '0 999px 999px 0' }
            : { right: '50%', width: `${widthPct}%`, borderRadius: '999px 0 0 999px' };
          labelStyle = positive
            ? (inside
              ? { left: `calc(50% + ${widthPct}%)`, transform: 'translate(calc(-100% - 6px), -50%)', color: '#ffffff' }
              : { left: `calc(50% + ${widthPct}% + 6px)`, transform: 'translateY(-50%)', color: 'var(--color-gray11, #37474f)' })
            : (inside
              ? { right: `calc(50% + ${widthPct}%)`, transform: 'translate(calc(100% + 6px), -50%)', color: '#ffffff' }
              : { right: `calc(50% + ${widthPct}% + 6px)`, transform: 'translateY(-50%)', color: 'var(--color-gray11, #37474f)' });
        } else {
          barStyle = { left: 0, width: `${widthPct}%`, borderRadius: '0 999px 999px 0' };
          labelStyle = inside
            ? { left: `${widthPct}%`, transform: 'translate(calc(-100% - 6px), -50%)', color: '#ffffff' }
            : { left: `calc(${widthPct}% + 6px)`, transform: 'translateY(-50%)', color: 'var(--color-gray11, #37474f)' };
        }

        return (
          <div key={it.label}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)', marginBottom: 2 }}>
              {it.label}
            </div>
            <div style={{ position: 'relative', height: 18, background: 'var(--color-gray3, #eceff1)', borderRadius: 999 }}>
              {mode === 'diverging' && (
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--color-gray6, #cfd8dc)' }} />
              )}
              <div style={{ position: 'absolute', top: 3, bottom: 3, background: color, ...barStyle }} />
              <span style={{ position: 'absolute', top: '50%', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-family-base)', ...labelStyle }}>
                {formatter(v)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FacultyImpactCompareBars;