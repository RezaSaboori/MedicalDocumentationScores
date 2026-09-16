import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { GROUP_COLOR_MAP } from '../../utils/flags';
import { formatNumber } from '../../utils/formatters';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import './PdiRankingChart.css';

const ROW_HEIGHT = 24;
const CHART_VERTICAL_MARGIN = 50; // ResponsiveBar margin top (10) + bottom (40)

const PdiRankingChart = () => {
  const { data } = useDashboard();
  const d = data.current;

  const chartData = useMemo(() => {
    if (!d || d.length === 0) return [];
    return [...d]
      .filter(row => row.N > 0)
      .sort((a, b) => a.PDI_noF - b.PDI_noF)
      .map(row => ({
        name: row.name,
        PDI_noF: row.PDI_noF,
        group_fa: row.group_fa,
        V: row.V,
        LAQ: row.LAQ,
        color: row.group_color || '#1f77b4',
      }));
  }, [d]);

  return (
    <div className="glass u-container u-container--md pdi-container">
      <h3 className="pdi-title">رتبه‌بندی شاخص ترکیبی مستندسازی پزشک (PDI_noF)</h3>
      <div
        className="pdi-body"
        style={{ height: `${chartData.length * ROW_HEIGHT + CHART_VERTICAL_MARGIN}px` }}
      >
        <ResponsiveBar
          data={chartData} keys={['PDI_noF']} indexBy="name" layout="horizontal"
          margin={{ top: 10, right: 56, bottom: 40, left: 140 }} padding={0.2}
          colors={({ data }) => data.color}
          axisBottom={{ legend: 'PDI_noF', legendPosition: 'middle', legendOffset: 30 }}
          axisLeft={{ tickSize: 0, tickPadding: 12 }}
          label={() => ''}
          layers={[
            'grid',
            'axes',
            'bars',
            (layerProps) => (
              <g key="value-labels">
                {layerProps.bars.map((bar) => {
                  const val = Number(
                    bar.data?.PDI_noF ??
                    bar.data?.data?.PDI_noF ??
                    bar.value
                  );
                  if (isNaN(val)) return null;
                  return (
                    <text
                      key={bar.key}
                      x={bar.x + bar.width + 6}
                      y={bar.y + bar.height / 2}
                      dominantBaseline="central"
                      textAnchor="start"
                      fontSize={11}
                      fontWeight={600}
                      fill="var(--color-gray12)"
                    >
                      {parseFloat(val.toFixed(2))}
                    </text>
                  );
                })}
              </g>
            ),
          ]}
          tooltip={({ data }) => (
            <ChartTooltip title={data.name} rows={[
              { label: 'گروه', value: data.group_fa }, { label: 'ویزیت', value: formatNumber(data.V) },
              { label: 'LAQ', value: data.LAQ?.toFixed(2) }, { label: 'PDI_noF', value: data.PDI_noF.toFixed(1) },
            ]} />
          )}
        />
      </div>
      <ChartLegend items={[...new Map(chartData.map(r => [r.group_fa, r.color])).entries()].map(([label, color]) => ({ label, color }))} />
    </div>
  );
};

export default PdiRankingChart;