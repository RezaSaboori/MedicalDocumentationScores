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

  const series = useMemo(() => {
    const byGroup = new Map();
    d.forEach((row) => {
      if (!byGroup.has(row.group_fa)) byGroup.set(row.group_fa, []);
      byGroup.get(row.group_fa).push({ ...row, x: Math.max(row.V, 1), y: row.WQS_adj });
    });
    return [...byGroup.entries()].map(([id, points]) => ({ id, data: points }));
  }, [d]);

  const colorByGroup = useMemo(
    () => new Map(d.map((r) => [r.group_fa, r.group_color])),
    [d]
  );

  const maxN = useMemo(() => Math.max(1, ...d.map((r) => Number(r.N) || 0)), [d]);

  const maxV = useMemo(() => Math.max(10, ...d.map((r) => Number(r.V) || 1)), [d]);

  const xTickValues = useMemo(() => {
    const limit = Math.ceil(maxV * 1.25);
    const ticks = [];
    for (let decade = 1; decade <= limit; decade *= 10) {
      for (const m of [1, 2, 5]) {
        const v = decade * m;
        if (v <= limit) ticks.push(v);
      }
    }
    return ticks;
  }, [maxV]);
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
          xScale={{ type: 'log', base: 10, min: 1, max: Math.ceil(maxV * 1.25) }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          margin={{ top: 16, right: 24, bottom: 64, left: 64 }}
          colors={({ serieId }) => colorByGroup.get(serieId) ?? '#1f77b4'}
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
            tickValues: xTickValues,
          }}
          axisLeft={{
            legend: 'شاخص کیفیت وزن‌دار تعدیل‌شده (WQS_adj)',
            legendPosition: 'middle',
            legendOffset: -46,
          }}
        />
      </div>
      <ChartLegend items={series.map((s) => ({ label: s.id, color: colorByGroup.get(s.id) }))} />
    </div>
  );
};

export default LoadVsQualityChart;