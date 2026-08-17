import React, { useEffect, useMemo } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import BubbleNodesLayer from './BubbleNodesLayer';
import ChartLegend from './ChartLegend';
import './LoadVsQualityChart.css';

const LoadVsQualityChart = () => {
  const { data } = useDashboard();
  const d = data.current;

  // Data-sample check: proves V/N reach the chart (CSV headers may carry trailing spaces).
  useEffect(() => {
    console.info('[LoadVsQuality] data sample:', d.slice(0, 3).map((r) => ({ name: r.name, V: r.V, N: r.N })));
  }, [d]);

  const series = useMemo(() => {
    const byGroup = new Map();
    d.forEach((row) => {
      if (!byGroup.has(row.group_fa)) byGroup.set(row.group_fa, []);
      byGroup.get(row.group_fa).push({ ...row, x: Math.max(row.V, 1), y: row.WQS_adj });
    });
    return [...byGroup.entries()].map(([id, points]) => ({ id, data: points }));
  }, [d]);

  const maxN = useMemo(() => Math.max(1, ...d.map((r) => Number(r.N) || 0)), [d]);
  const meanQ = useMemo(
    () => (d.length ? d.reduce((s, r) => s + (r.WQS_adj || 0), 0) / d.length : 0),
    [d]
  );

  const MeanLineLayer = ({ yScale, innerWidth }) => (
    <g>
      <line x1={0} x2={innerWidth} y1={yScale(meanQ)} y2={yScale(meanQ)} stroke="grey" strokeDasharray="6 4" />
      <text x={innerWidth} y={yScale(meanQ) - 6} textAnchor="end" className="chart-axis-text">
        میانگین انستیتو
      </text>
    </g>
  );

  return (
    <div className="glass u-container u-container--md lvq-container">
      <h3 className="lvq-title">بار کاری یا حجم ویزیت دربرابر کیفیت</h3>
      <p className="lvq-subtitle">(اندازه حباب = تعداد پرونده طبقه‌بندی‌شده)</p>
      <div className="lvq-body" dir="ltr" style={{ height: 420 }}>
        <ResponsiveScatterPlot
          data={series}
          xScale={{ type: 'log', base: 10, max: 'auto' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          margin={{ top: 16, right: 24, bottom: 64, left: 64 }}
          colors={({ serieId }) => GROUP_COLOR_MAP[serieId] ?? '#1f77b4'}
          layers={[
            'grid',
            'axes',
            (layerProps) => <MeanLineLayer key="mean" {...layerProps} />,
            (layerProps) => <BubbleNodesLayer key="bubbles" {...layerProps} sizeKey="N" maxValue={maxN} />,
          ]}
          axisBottom={{
            legend: 'تعداد ویزیت (مقیاس لگاریتمی)',
            legendPosition: 'middle',
            legendOffset: 46,
          }}
          axisLeft={{
            legend: 'شاخص کیفیت وزن‌دار تعدیل‌شده (WQS_adj)',
            legendPosition: 'middle',
            legendOffset: -46,
          }}
        />
      </div>
      <ChartLegend items={series.map((s) => ({ label: s.id, color: GROUP_COLOR_MAP[s.id] }))} />
    </div>
  );
};

export default LoadVsQualityChart;