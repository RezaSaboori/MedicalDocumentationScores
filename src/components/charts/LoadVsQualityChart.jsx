import React, { useEffect, useMemo } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useDashboard } from '../../context/DashboardContext';
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

  const series = useMemo(
    () => [{ id: 'all', data: d.map((row) => ({ ...row, x: Math.max(row.V, 1), y: row.WQS_adj })) }],
    [d]
  );

  const maxN = useMemo(() => Math.max(1, ...d.map((r) => Number(r.N) || 0)), [d]);
  const meanQ = useMemo(
    () => (d.length ? d.reduce((s, r) => s + (r.WQS_adj || 0), 0) / d.length : 0),
    [d]
  );

  const MeanLineLayer = ({ yScale, innerWidth }) => {
    const y = yScale(meanQ);
    if (!Number.isFinite(y)) return null; // empty data → auto scale is NaN
    return (
      <g>
        <line x1={0} x2={innerWidth} y1={y} y2={y} stroke="grey" strokeDasharray="6 4" />
        <text x={innerWidth} y={y - 6} textAnchor="end" className="chart-axis-text">
          میانگین انستیتو
        </text>
      </g>
    );
  };

  if (!d.length) {
    return (
      <div className="glass u-container u-container--md lvq-container">
        <h3 className="lvq-title">بار کاری یا حجم ویزیت دربرابر کیفیت</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, color: 'var(--color-gray8)', fontFamily: 'var(--font-family-base)' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      </div>
    );
  }

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
          colors={() => '#1f77b4'}
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
      <ChartLegend items={[{ label: 'همه', color: '#1f77b4' }]} />
    </div>
  );
};

export default LoadVsQualityChart;