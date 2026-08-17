import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, BASE_FLAG_COLOR } from '../../utils/constants';
import { blendHex } from '../../utils/flags';
import ChartTooltip from './ChartTooltip';
import './GroupDonutChart.css';

// data-coordinate → svg-pixel mapping (100px per unit, matches plotly ranges)
const SX = (x) => (x + 2.3) * 100;
const SY = (y) => (2.0 - y) * 100;

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

    const aOnly = [...integrity].filter((x) => !engagement.has(x) && !lowData.has(x)).length;
    const bOnly = [...engagement].filter((x) => !integrity.has(x) && !lowData.has(x)).length;
    const cOnly = [...lowData].filter((x) => !integrity.has(x) && !engagement.has(x)).length;
    const ab = [...integrity].filter((x) => engagement.has(x) && !lowData.has(x)).length;
    const ac = [...integrity].filter((x) => lowData.has(x) && !engagement.has(x)).length;
    const bc = [...engagement].filter((x) => lowData.has(x) && !integrity.has(x)).length;
    const abc = [...integrity].filter((x) => engagement.has(x) && lowData.has(x)).length;

    const C_A = BASE_FLAG_COLOR.INTEGRITY_AUDIT;
    const C_B = BASE_FLAG_COLOR.ENGAGEMENT_TRAINING;
    const C_C = BASE_FLAG_COLOR.LOW_DATA;

    const circles = [
      { id: 'A', cx: -0.62, cy: 0.50, color: C_A, label: BASE_FLAG_FA.INTEGRITY_AUDIT, total: integrity.size },
      { id: 'B', cx: 0.62, cy: 0.50, color: C_B, label: BASE_FLAG_FA.ENGAGEMENT_TRAINING, total: engagement.size },
      { id: 'C', cx: 0.00, cy: -0.58, color: C_C, label: BASE_FLAG_FA.LOW_DATA, total: lowData.size },
    ];

    const regions = [
      { id: 'a', x: -1.05, y: 0.75, count: aOnly, name: BASE_FLAG_FA.INTEGRITY_AUDIT, color: C_A },
      { id: 'b', x: 1.05, y: 0.75, count: bOnly, name: BASE_FLAG_FA.ENGAGEMENT_TRAINING, color: C_B },
      { id: 'c', x: 0.00, y: -1.10, count: cOnly, name: BASE_FLAG_FA.LOW_DATA, color: C_C },
      { id: 'ab', x: 0.00, y: 0.90, count: ab, name: 'مشکوک به داده کاذبِ کم‌حوصله', color: blendHex([C_A, C_B]) },
      { id: 'ac', x: -0.68, y: -0.30, count: ac, name: 'فاقد ویزیت کافی (احتمالا مشکوک به داده کاذب)', color: blendHex([C_A, C_C]) },
      { id: 'bc', x: 0.68, y: -0.30, count: bc, name: 'فاقد ویزیت کافی (احتمالا کم‌حوصله)', color: blendHex([C_B, C_C]) },
      { id: 'abc', x: 0.00, y: 0.12, count: abc, name: 'فاقد ویزیت کافی (احتمالا کم‌حوصله و مشکوک به داده کاذب)', color: blendHex([C_A, C_B, C_C]) },
    ];

    return { circles, regions };
  }, [d]);

  if (!d || d.length === 0) {
    return (
      <div className="glass u-container u-container--md chart-container">
        <h3 className="chart-title">تقاطع گروه‌های رفتاری</h3>
        <div style={EMPTY_STYLE}>داده‌ای برای نمایش وجود ندارد</div>
      </div>
    );
  }

  const hoveredRegion = model.regions.find((r) => r.id === hovered);
  const hoveredCircle = model.circles.find((c) => c.id === hovered);

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">تقاطع گروه‌های رفتاری</h3>
      <div className="venn-wrapper">
        <svg viewBox="0 0 460 410" className="venn-svg">
          {model.circles.map((c) => (
            <circle key={`halo-${c.id}`} cx={SX(c.cx)} cy={SY(c.cy)} r={112} fill={c.color} opacity={0.10} />
          ))}
          {model.circles.map((c) => (
            <circle
              key={c.id}
              className={`venn-part${hovered === c.id ? ' is-hover' : ''}`}
              cx={SX(c.cx)}
              cy={SY(c.cy)}
              r={105}
              fill={c.color}
              opacity={0.38}
              stroke={c.color}
              strokeWidth={3}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {model.regions.map((r) => (
            <g
              key={r.id}
              className={`venn-part${hovered === r.id ? ' is-hover' : ''}`}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={SX(r.x)} cy={SY(r.y)} r={18} fill="rgba(255,255,255,0.92)" stroke={r.color} strokeWidth={2.5} />
              <text x={SX(r.x)} y={SY(r.y) + 5} textAnchor="middle" className="venn-count">{r.count}</text>
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
      {(hoveredRegion || hoveredCircle) && (
        <ChartTooltip
          title={hoveredRegion ? hoveredRegion.name : hoveredCircle.label}
          rows={[{ label: 'تعداد پزشکان', value: hoveredRegion ? hoveredRegion.count : hoveredCircle.total }]}
        />
      )}
    </div>
  );
};

export default GroupDonutChart;