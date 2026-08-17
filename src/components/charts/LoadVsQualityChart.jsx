import React, { useMemo } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import { formatNumber, formatPercent } from '../../utils/formatters';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import './LoadVsQualityChart.css';

const bubbleSize = (node) => Math.min(34, 8 + Math.sqrt(node.data.N ?? 10) * 1.1);

const MeanLineLayer = ({ yScale, innerWidth, mean }) => {
  const y = yScale(mean);
  return (
    <g>
      <line className="lvq-mean-line" x1={0} x2={innerWidth} y1={y} y2={y} />
      <text className="lvq-mean-label" x={innerWidth - 6} y={y - 8}>
        میانگین انستیتو
      </text>
    </g>
  );
};

const Tooltip = ({ node }) => (
  <ChartTooltip
    title={node.data.name}
    rows={[
      { label: 'گروه', value: node.data.group_fa },
      { label: 'ویزیت', value: formatNumber(node.data.V) },
      { label: 'WQS_adj', value: node.data.y.toFixed(2) },
      { label: 'PDI', value: node.data.PDI.toFixed(1) },
      { label: 'LAQ', value: node.data.LAQ.toFixed(2) },
      { label: 'نرخ داده کاذب', value: formatPercent(node.data.rho_F) },
      { label: 'نرخ خالی', value: formatPercent(node.data.rho_Z) },
    ]}
  />
);

const LoadVsQualityChart = () => {
  const { data } = useDashboard();
  const d = data.current || [];

  const { series, mean } = useMemo(() => {
    const meanValue = d.length ? d.reduce((sum, row) => sum + row.WQS_adj, 0) / d.length : 0;
    const byGroup = new Map();
    d.forEach((row) => {
      if (!byGroup.has(row.group_fa)) byGroup.set(row.group_fa, []);
      byGroup.get(row.group_fa).push({ ...row, x: row.V, y: row.WQS_adj });
    });

    return {
      series: [...byGroup.entries()].map(([id, points]) => ({ id, data: points })),
      mean: meanValue,
    };
  }, [d]);

  return (
    <div className="glass u-container u-container--md lvq-container">
      <h3 className="lvq-title">بار کاری یا حجم ویزیت دربرابر کیفیت</h3>
      <p className="lvq-subtitle">(اندازه حباب = تعداد پرونده طبقه‌بندی‌شده)</p>
      <div className="lvq-body">
        <ResponsiveScatterPlot
          data={series}
          xScale={{ type: 'log', base: 10 }}
          yScale={{ type: 'linear', min: 0, max: 1 }}
          margin={{ top: 16, right: 24, bottom: 64, left: 64 }}
          colors={({ serieId }) => GROUP_COLOR_MAP[serieId] ?? '#1f77b4'}
          size={bubbleSize}
          layers={[
            'grid',
            'axes',
            'nodes',
            (layerProps) => <MeanLineLayer key="mean" {...layerProps} mean={mean} />,
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
          tooltip={Tooltip}
        />
      </div>
      <ChartLegend
        items={series.map((s) => ({ label: s.id, color: GROUP_COLOR_MAP[s.id] }))}
      />
    </div>
  );
};

export default LoadVsQualityChart;