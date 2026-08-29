import React, { useId } from 'react';

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx, cy, r, endDeg, clockwise) => {
  const start = polar(cx, cy, r, 0);
  const end = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${clockwise ? 1 : 0} ${end.x} ${end.y}`;
};

const FacultyImpactRadialCompare = ({ items, mode = 'diverging', formatter }) => {
  const uid = useId().replace(/:/g, '');
  const usable = items.filter(it => it.value !== null && it.value !== undefined);
  if (!usable.length) return null;

  const maxAbs = Math.max(...usable.map(i => Math.abs(i.value || 0)), 0.0001);
  const CX = 100;
  const CY = 100;
  const radii = [78, 52];
  const SW = 22;

  const colorOf = (it) =>
    it.color || ((it.value || 0) >= 0 ? 'var(--color-green, #10b981)' : 'var(--color-red, #ef4444)');

  const fmtVal = (v) => (formatter ? formatter(v) : `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}`);

  return (
    <div>
      <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto', direction: 'ltr' }}>
        <defs>
          {usable.map((it, i) => (
            it.pattern === 'dots' ? (
              <pattern key={i} id={`${uid}-p${i}`} patternUnits="userSpaceOnUse" width="7" height="7">
                <circle cx="3.5" cy="3.5" r="1.8" fill={colorOf(it)} />
              </pattern>
            ) : (
              <pattern key={i} id={`${uid}-p${i}`} patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="7" stroke={colorOf(it)} strokeWidth="3.5" />
              </pattern>
            )
          ))}
        </defs>

        {usable.map((_, i) => (
          <circle key={`t${i}`} cx={CX} cy={CY} r={radii[i]} fill="none" stroke="var(--color-gray6, #cfd8dc)" strokeWidth={SW} opacity={0.5} />
        ))}

        <line x1={CX} y1={CY - radii[0] - SW / 2} x2={CX} y2={CY - radii[usable.length - 1] + SW / 2} stroke="var(--color-gray1, #ffffff)" strokeWidth="2" />

        {usable.map((it, i) => {
          const v = it.value;
          const clockwise = mode === 'positive' ? true : v >= 0;
          const span = Math.max(Math.min(Math.abs(v) / maxAbs, 1) * 180, 0.5);
          const r = radii[i];
          const endDeg = clockwise ? span : -span;
          const end = polar(CX, CY, r, endDeg);
          return (
            <g key={i}>
              <path d={arcPath(CX, CY, r, endDeg, clockwise)} fill="none" stroke={colorOf(it)} strokeWidth={SW} opacity={0.35} />
              <path d={arcPath(CX, CY, r, endDeg, clockwise)} fill="none" stroke={`url(#${uid}-p${i})`} strokeWidth={SW} />
              <circle cx={end.x} cy={end.y} r={SW / 2} fill={colorOf(it)} opacity={0.9} />
            </g>
          );
        })}

        {usable.map((it, i) => {
          const clockwise = mode === 'positive' ? true : (it.value || 0) >= 0;
          // The label sits on the EMPTY side of the center line:
          // positive arc goes right -> label left; negative arc goes left -> label right.
          const leftSide = clockwise;
          return (
            <text
              key={`v${i}`}
              x={leftSide ? CX - 10 : CX + 10}
              y={i === 0 ? CY - radii[0] + 4 : CY - radii[1] + 4}
              textAnchor={leftSide ? 'end' : 'start'}
              style={{ fontSize: 13, fontWeight: 700, fill: colorOf(it), fontFamily: 'var(--font-family-base)' }}
            >
              {fmtVal(it.value)}
            </text>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        {usable.map((it, i) => (
          <div key={`l${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--color-gray9, #607d8b)', fontFamily: 'var(--font-family-base)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
              <rect width="14" height="14" rx="3" fill="var(--color-gray3, #eceff1)" />
              {it.pattern === 'dots'
                ? <circle cx="7" cy="7" r="2.2" fill={colorOf(it)} />
                : <path d="M2 12 L12 2" stroke={colorOf(it)} strokeWidth="3" />}
            </svg>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyImpactRadialCompare;