import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, BASE_FLAG_COLOR } from '../../utils/constants';
import { blendHex } from '../../utils/flags';
import ChartTooltip from './ChartTooltip';
import './GroupDonutChart.css';

// Fixed geometry (100px per data unit, mirrors plotly ranges)
const A = { cx: 180, cy: 205, r: 120 };
const B = { cx: 280, cy: 205, r: 120 };

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
    const engagement = new Set(
      d
        .filter((row) => row.flags.includes('ENGAGEMENT_TRAINING'))
        .map((row) => row.name)
    );

    const lowData = new Set(
      d
        .filter((row) => row.flags.includes('LOW_DATA'))
        .map((row) => row.name)
    );

    const C_A = BASE_FLAG_COLOR.ENGAGEMENT_TRAINING;
    const C_B = BASE_FLAG_COLOR.LOW_DATA;

    const regions = [
      {
        id: 'a',
        count: [...engagement].filter((name) => !lowData.has(name)).length,
        name: BASE_FLAG_FA.ENGAGEMENT_TRAINING,
        color: C_A,
        bx: 140,
        by: 205,
      },
      {
        id: 'b',
        count: [...lowData].filter((name) => !engagement.has(name)).length,
        name: BASE_FLAG_FA.LOW_DATA,
        color: C_B,
        bx: 320,
        by: 205,
      },
      {
        id: 'ab',
        count: [...engagement].filter((name) => lowData.has(name)).length,
        name: 'فاقد ویزیت کافی (مشکوک به کم‌حوصلگی)',
        color: blendHex([C_A, C_B]),
        bx: 230,
        by: 205,
      },
    ];

    const circles = [
      {
        ...A,
        id: 'A',
        color: C_A,
        label: BASE_FLAG_FA.ENGAGEMENT_TRAINING,
        total: engagement.size,
      },
      {
        ...B,
        id: 'B',
        color: C_B,
        label: BASE_FLAG_FA.LOW_DATA,
        total: lowData.size,
      },
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
            <clipPath id="gv-clip-A">
              <circle cx={A.cx} cy={A.cy} r={A.r} />
            </clipPath>

            <mask id="gv-mask-a" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={B.cx} cy={B.cy} r={B.r} fill="black" />
            </mask>

            <mask id="gv-mask-b" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="410">
              <rect width="460" height="410" fill="white" />
              <circle cx={A.cx} cy={A.cy} r={A.r} fill="black" />
            </mask>
          </defs>

          {model.circles.map((circle) => (
            <circle
              key={`halo-${circle.id}`}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r * 1.07}
              fill={circle.color}
              opacity={0.10}
              className="venn-static"
            />
          ))}

          <circle
            {...A}
            className={regionClass('a')}
            fill={model.regions[0].color}
            mask="url(#gv-mask-a)"
            {...hoverProps('a')}
          />

          <circle
            {...B}
            className={regionClass('b')}
            fill={model.regions[1].color}
            mask="url(#gv-mask-b)"
            {...hoverProps('b')}
          />

          <g clipPath="url(#gv-clip-A)">
            <circle
              {...B}
              className={regionClass('ab')}
              fill={model.regions[2].color}
              {...hoverProps('ab')}
            />
          </g>

          {model.circles.map((circle) => (
            <circle
              key={`outline-${circle.id}`}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="none"
              stroke={circle.color}
              strokeWidth={3}
              className="venn-outline"
            />
          ))}

          {model.regions.map((region) => (
            <g
              key={`badge-${region.id}`}
              className="venn-badge"
              {...hoverProps(region.id)}
            >
              <circle
                cx={region.bx}
                cy={region.by}
                r={18}
                fill="rgba(255,255,255,0.92)"
                stroke={region.color}
                strokeWidth={2.5}
              />
              <text
                x={region.bx}
                y={region.by + 5}
                textAnchor="middle"
                className="venn-count"
              >
                {region.count}
              </text>
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