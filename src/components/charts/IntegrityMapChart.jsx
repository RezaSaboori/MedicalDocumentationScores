import React, { useMemo } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import { formatNumber, formatPercent } from '../../utils/formatters';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import './IntegrityMapChart.css';

const RISK_ZONES = [
  { x: 0.15, y: 0.02, label: '✅ سالم' },
  { x: 0.75, y: 0.02, label: '🟠 کم‌حوصله' },
  { x: 0.15, y: 0.35, label: '🔴 مشکوک به داده کاذب' },
  { x: 0.75, y: 0.35, label: '⛔ بحرانی (هر دو)' },
];

const RiskZonesLayer = ({ xScale, yScale, innerWidth, innerHeight }) => (
  <g>
    <line className="im-line-x" x1={xScale(0.4)} x2={xScale(0.4)} y1={0} y2={innerHeight} />
    <line className="im-line-y" x1={0} x2={innerWidth} y1={yScale(0.05)} y2={yScale(0.05)} />
    {RISK_ZONES.map((zone) => (
      <text key={zone.label} className="im-zone-label" x={xScale(zone.x)} y={yScale(zone.y)}>
        {zone.label}
      </text>
    ))}
  </g>
);

const Tooltip = ({ node }) => (
  <ChartTooltip
    title={node.data.name}
    rows={[
      { label: 'گروه', value: node.data.group_fa },
      { label: 'PDI', value: node.data.PDI?.toFixed(1) },
      { label: 'نرخ خالی', value: formatPercent(node.data.x) },
      { label: 'نرخ داده کاذب', value: formatPercent(node.data.y) },
      { label: 'ویزیت', value: formatNumber(node.data.V) },
    ]}
  />
);

const IntegrityMapChart = () => {
  const { data } = useDashboard();
  const d = data.current;

  const series = useMemo(() => {
    const byGroup = new Map();
    d.forEach((row) => {
      if (!byGroup.has(row.group_fa)) byGroup.set(row.group_fa, []);
      byGroup.get(row.group_fa).push({ ...row, x: row.rho_Z, y: row.rho_F });
    });
    return [...byGroup.entries()].map(([id, points]) => ({ id, data: points }));
  }, [d]);

  const maxV = useMemo(() => Math.max(1, ...d.map((r) => r.V || 0)), [d]);

  // Bubble diameter encodes visit volume (V) — mirrors size="V" in dashboard.py
  const bubbleSize = ({ data }) => 6 + 29 * Math.sqrt((data.V || 0) / maxV);

  const percentTick = (value) => `${Math.round(value * 100)}٪`;

  return (
    <div className="glass u-container u-container--md im-container">
      <h3 className="im-title">نقشه ریسک — اندازه حباب = حجم ویزیت</h3>
      <div className="im-body" style={{ height: 420 }}>
        <ResponsiveScatterPlot
          data={series}
          xScale={{ type: 'linear', min: 0, max: 1 }}
          yScale={{ type: 'linear', min: 0, max: 0.5 }}
          margin={{ top: 16, right: 24, bottom: 64, left: 64 }}
          colors={({ serieId }) => GROUP_COLOR_MAP[serieId] ?? '#1f77b4'}
          size={bubbleSize}
          layers={[
            'grid',
            'axes',
            (layerProps) => <RiskZonesLayer key="zones" {...layerProps} />,
            'nodes',
          ]}
          axisBottom={{
            legend: 'نرخ پرونده خالی/نسبتا خالی (کم‌حوصلگی)',
            legendPosition: 'middle',
            legendOffset: 46,
            format: percentTick,
          }}
          axisLeft={{
            legend: 'نرخ مشکوک به داده کاذب',
            legendPosition: 'middle',
            legendOffset: -46,
            format: percentTick,
          }}
          tooltip={Tooltip}
        />
      </div>
      <ChartLegend items={series.map((s) => ({ label: s.id, color: GROUP_COLOR_MAP[s.id] }))} />
    </div>
  );
};

export default IntegrityMapChart;