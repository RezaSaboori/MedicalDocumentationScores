import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import './LaqDistributionChart.css';

const NBINS = 30;

// Band scales are categorical: the 0-line must be placed via the bin label, not xScale(0)
const MeanLineLayer = ({ xScale, innerHeight, zeroLabel }) => {
  if (zeroLabel == null || typeof xScale !== 'function') return null;
  const bandStart = xScale(zeroLabel);
  if (bandStart == null || Number.isNaN(bandStart)) return null;
  const bandwidth = typeof xScale.bandwidth === 'function' ? xScale.bandwidth() : 0;
  const x = bandStart + bandwidth / 2;
  return (
    <g>
      <line className="laq-mean-line" x1={x} x2={x} y1={0} y2={innerHeight} />
      <text className="laq-mean-label" x={x + 6} y={16}>حد انتظار</text>
    </g>
  );
};

const LaqDistributionChart = () => {
  const { data } = useDashboard();
  const d = (data.current || []).filter(row => !row.flags.includes('LOW_DATA'));

  const { chartData, keys, zeroLabel } = useMemo(() => {
    if (d.length === 0) return { chartData: [], keys: [], zeroLabel: null };

    const laqValues = d.map(row => row.LAQ);
    const min = Math.min(...laqValues);
    const max = Math.max(...laqValues);
    const binWidth = (max - min) / NBINS || 1;

    const bins = Array.from({ length: NBINS }, (_, i) => ({
      binLabel: (min + i * binWidth).toFixed(2),
    }));

    d.forEach(row => {
      const binIndex = Math.min(NBINS - 1, Math.max(0, Math.floor((row.LAQ - min) / binWidth)));
      bins[binIndex][row.group_fa] = (bins[binIndex][row.group_fa] || 0) + 1;
    });

    let zero = null;
    if (min <= 0 && max >= 0) {
      const idx = Math.min(NBINS - 1, Math.max(0, Math.floor((0 - min) / binWidth)));
      zero = bins[idx].binLabel;
    }

    return { chartData: bins, keys: [...new Set(d.map(row => row.group_fa))], zeroLabel: zero };
  }, [d]);

  return (
    <div className="glass u-container u-container--md laq-container">
      <h3 className="laq-title">تعداد و گروه‌بندی پزشکان براساس شاخص کیفیت تعدیل‌شده با بار کاری</h3>
      <p className="laq-subtitle">(راستِ خط یعنی بهتر از انتظار)</p>
      <div className="laq-body" dir="ltr">
        <ResponsiveBar
          data={chartData}
          keys={keys}
          indexBy="binLabel"
          tooltip={({ id, value, data }) => (
            <ChartTooltip
              title={`بازه LAQ: ${data.binLabel}`}
              rows={[{ label: String(id), value: Number(value) }]}
            />
          )}
          margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
          padding={0.05}
          colors={({ id }) => GROUP_COLOR_MAP[id] || '#1f77b4'}
          layers={[
            'grid',
            'axes',
            'bars',
            (props) => <MeanLineLayer key="mean" {...props} zeroLabel={zeroLabel} />,
          ]}
          axisBottom={{ legend: 'LAQ (انحراف از حد انتظار)', legendPosition: 'middle', legendOffset: 40, tickValues: 6 }}
          axisLeft={{ legend: 'تعداد پزشکان', legendPosition: 'middle', legendOffset: -40 }}
        />
      </div>
      <ChartLegend items={keys.map(k => ({ label: k, color: GROUP_COLOR_MAP[k] }))} />
    </div>
  );
};

export default LaqDistributionChart;