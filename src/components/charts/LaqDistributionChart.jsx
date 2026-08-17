import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import './LaqDistributionChart.css';

const NBINS = 30;

const MeanLineLayer = ({ xScale, innerHeight }) => {
  const x = xScale(0);
  return (
    <g>
      <line className="laq-mean-line" x1={x} x2={x} y1={0} y2={innerHeight} />
      <text className="laq-mean-label" x={x + 6} y={16}>حد انتظار</text>
    </g>
  );
};

const LaqDistributionChart = () => {
  const { data } = useDashboard();
  const d = data.current.filter(row => !row.flags.includes('LOW_DATA'));

  const { chartData, keys } = useMemo(() => {
    if (d.length === 0) return { chartData: [], keys: [] };
    const laqValues = d.map(row => row.LAQ);
    const min = Math.min(...laqValues);
    const max = Math.max(...laqValues);
    const binWidth = (max - min) / NBINS || 1;

    const bins = Array.from({ length: NBINS }, (_, i) => ({
      binLabel: (min + i * binWidth).toFixed(2),
    }));

    const groups = new Set(d.map(row => row.group_fa));
    d.forEach(row => {
      const binIndex = Math.min(NBINS - 1, Math.floor((row.LAQ - min) / binWidth));
      if (binIndex >= 0 && bins[binIndex]) {
        bins[binIndex][row.group_fa] = (bins[binIndex][row.group_fa] || 0) + 1;
      }
    });

    return { chartData: bins, keys: Array.from(groups) };
  }, [d]);

  return (
    <div className="glass u-container u-container--md laq-container">
      <h3 className="laq-title">تعداد و گروه‌بندی پزشکان براساس شاخص کیفیت تعدیل‌شده با بار کاری</h3>
      <p className="laq-subtitle">(راستِ خط یعنی بهتر از انتظار)</p>
      <div className="laq-body">
        <ResponsiveBar
          data={chartData}
          keys={keys}
          indexBy="binLabel"
          margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
          padding={0.05}
          colors={({ id }) => GROUP_COLOR_MAP[id] || '#1f77b4'}
          layers={['grid', 'axes', 'bars', (props) => <MeanLineLayer key="mean" {...props} />]}
          axisBottom={{ legend: 'LAQ (انحراف از حد انتظار)', legendPosition: 'middle', legendOffset: 40, tickValues: 6 }}
          axisLeft={{ legend: 'تعداد پزشکان', legendPosition: 'middle', legendOffset: -40 }}
        />
      </div>
      <ChartLegend items={keys.map(k => ({ label: k, color: GROUP_COLOR_MAP[k] }))} />
    </div>
  );
};

export default LaqDistributionChart;