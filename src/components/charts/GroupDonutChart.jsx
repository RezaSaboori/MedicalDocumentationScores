import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, BASE_FLAG_COLOR } from '../../utils/constants';
import { blendHex } from '../../utils/flags';
import ChartTooltip from './ChartTooltip';
import './GroupDonutChart.css';

// Fixed geometry (100px per data unit, mirrors plotly ranges)
const A = { cx: 168, cy: 150, r: 105 };
const B = { cx: 292, cy: 150, r: 105 };
const C = { cx: 230, cy: 258, r: 105 };

const EMPTY_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '240px',
  color: 'var(--color-gray8)',
  fontFamily: 'var(--font-family-base)',
};

const GroupDonutChart = () => {
  const { data } = useDashboard();
  const d = data.current;
  const [hovered, setHovered] = useState(null);

  const model = useMemo(() => {
    const integrity = new Set(d.filter((r) => r.flags.includes('INTEGRITY_AUDIT')).map((r) => r.name));
    const engagement = new Set(d.filter((r) => r.flags.includes('ENGAGEMENT_TRAINING')).map((r) => r.name));
    const lowData = new Set(d.filter((r) => r.flags.includes('LOW_DATA')).map((r) => r.name));

    const C_A = BASE_FLAG_COLOR.INTEGRITY_AUDIT;
    const C_B = BASE_FLAG_COLOR.ENGAGEMENT_TRAINING;
    const C_C = BASE_FLAG_COLOR.LOW_DATA;

    const regions = [
      { id: 'a', count: [...integrity].filter((x) => !engagement.has(x) && !lowData.has(x)).length, name: BASE_FLAG_FA.INTEGRITY_AUDIT, color: C_A, bx: 125, by: 125 },
      { id: 'b', count: [...engagement].filter((x) => !integrity.has(x) && !lowData.has(x)).length, name: BASE_FLAG_FA.ENGAGEMENT_TRAINING, color: C_B, bx: 335, by: 125 },
      { id: 'c', count: [...lowData].filter((x) => !integrity.has(x) && !engagement.has(x)).length, name: BASE_FLAG_FA.LOW_DATA, color: C_C, bx: 230, by: 310 },
      { id: 'ab', count: [...integrity].filter((x) => engagement.has(x) && !lowData.has(x)).length, name: 'مشکوک به داده کاذبِ کم‌حوصله', color: blendHex([C_A, C_B]), bx: 230, by: 110 },
      { id: 'ac', count: [...integrity].filter((x) => lowData.has(x) && !engagement.has(x)).length, name: 'فاقد ویزیت کافی (احتمالا مشکوک به داده کاذب)', color: blendHex([C_A, C_C]), bx: 162, by: 230 },
      { id: 'bc', count: [...engagement].filter((x) => lowData.has(x) && !integrity.has(x)).length, name: 'فاقد ویزیت کافی (احتمالا کم‌حوصله)', color: blendHex([C_B, C_C]), bx: 298, by: 230 },
      { id: 'abc', count: [...integrity].filter((x) => engagement.has(x) && lowData.has(x)).length, name: 'فاقد ویزیت کافی (احتمالا کم‌حوصله و مشکوک به داده کاذب)', color: blendHex([C_A, C_B, C_C]), bx: 230, by: 188 },
    ];

    const circles = [
      { ...A, id: 'A', color: C_A, label: BASE_FLAG_FA.INTEGRITY_AUDIT, total: integrity.size },
      { ...B, id: 'B', color: C_B, label: BASE_FLAG_FA.ENGAGEMENT_TRAINING, total: engagement.size },
      { ...C, id: 'C', color: C_C, label: BASE_FLAG_FA.LOW_DATA, total: lowData.size },
    ];

    return { regions, circles };
  }, [d]);

  if (!d || d.length === 0) {
    return (
      <div className="glass u-container u-container--md chart-container">
        <h3 className="chart-title">تقاطع گروه‌های رفتاری</h3>
        <div style={EMPTY_STYLE}>داده‌ای برای نمایش وجود ندارد</div>
      </div>
    );
  }

  const hoverProps = (id) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
  });

  const regionClass = (id) => `venn-region${hovered === id ? ' is-hover' : ''}`;
  const hoveredRegion = model.regions.find((r) => r.id === hovered);

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">تقاطع گروه‌های رفتاری</h3>
      <div className="venn-wrapper">
        <svg viewBox="0 0 460 410" className="venn-svg">
          <defs>
            <clipPath id="gv-clip-A"><circle cx={A.cx} cy={A.cy} r={A.r} /></clipPath>
            <clipPath id="gv-clip-B"><circle cx={B.cx} cy={B.cy} r={B.r} /></clipPath>
            <clipPath id="gv-clip-C"><circle cx={C.cx} cy={C.cy} r={C.r} /></clipPath>
            <mask id="gv-mask-a" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
              <circle cx={C.cx} cy={C.cy} r={C.r} fill="black" />
            </mask>
            <mask id="gv-mask-b" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
              <circle cx={C.cx} cy={C.cy} r={C.r} fill="black" />
            </mask>
            <mask id="gv-mask-c" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
              <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
            </mask>
            <mask id="gv-mask-notA" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
            </mask>
            <mask id="gv-mask-notB" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
            </mask>
            <mask id="gv-mask-notC" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={C.cx} cy={C.cy} r={C.r} fill="black" />
            </mask>
          </defs>

          {/* halos */}
          {model.circles.map((c) => (
            <circle key={`halo-${c.id}`} cx={c.cx} cy={c.cy} r={c.r * 1.07} fill={c.color} opacity={0.10} className="venn-static" />
          ))}

          {/* the 7 true regions — each hoverable on its own */}
          <circle {...A} className={regionClass('a')} fill={model.regions[0].color} mask="url(#gv-mask-a)" {...hoverProps('a')} />
          <circle {...B} className={regionClass('b')} fill={model.regions[1].color} mask="url(#gv-mask-b)" {...hoverProps('b')} />
          <circle {...C} className={regionClass('c')} fill={model.regions[2].color} mask="url(#gv-mask-c)" {...hoverProps('c')} />
          <g clipPath="url(#gv-clip-A)">
            <circle {...B} className={regionClass('ab')} fill={model.regions[3].color} mask="url(#gv-mask-notC)" {...hoverProps('ab')} />
          </g>
          <g clipPath="url(#gv-clip-A)">
            <circle {...C} className={regionClass('ac')} fill={model.regions[4].color} mask="url(#gv-mask-notB)" {...hoverProps('ac')} />
          </g>
          <g clipPath="url(#gv-clip-B)">
            <circle {...C} className={regionClass('bc')} fill={model.regions[5].color} mask="url(#gv-mask-notA)" {...hoverProps('bc')} />
          </g>
          <g clipPath="url(#gv-clip-A)">
            <g clipPath="url(#gv-clip-B)">
              <circle {...C} className={regionClass('abc')} fill={model.regions[6].color} {...hoverProps('abc')} />
            </g>
          </g>

          {/* circle outlines (non-interactive) */}
          {model.circles.map((c) => (
            <circle key={`outline-${c.id}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={c.color} strokeWidth={3} className="venn-outline" />
          ))}

          {/* count badges: hovering elevates the REGION, never the badge */}
          {model.regions.map((r) => (
            <g key={`badge-${r.id}`} className="venn-badge" {...hoverProps(r.id)}>
              <circle cx={r.bx} cy={r.by} r={18} fill="rgba(255,255,255,0.92)" stroke={r.color} strokeWidth={2.5} />
              <text x={r.bx} y={r.by + 5} textAnchor="middle" className="venn-count">{r.count}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="venn-legend">
        {model.circles.map((c) => (
          <div key={c.id} className="legend-item">
            <span className="legend-dot" style={{ background: c.color }}></span>
            <span className="legend-label">{c.label} ({c.total})</span>
          </div>
        ))}
      </div>
      {hoveredRegion && (
        <ChartTooltip
          title={hoveredRegion.name}
          rows={[{ label: 'تعداد پزشکان', value: hoveredRegion.count }]}
        />
      )}
    </div>
  );
};

export default GroupDonutChart;