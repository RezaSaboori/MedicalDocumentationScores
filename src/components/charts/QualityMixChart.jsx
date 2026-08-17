import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES } from '../../utils/constants';
import { pdiGradientColor } from '../../utils/formatters';
import ChartLegend from './ChartLegend';
import './QualityMixChart.css';

const PDI_THRESHOLD = 50;
const HEADER_PX = 96;
const FOOTER_PX = 140; // axis(48) + status(34) + legend(46) + padding(12)

// Ported from dashboard.py dynamic sizing logic
const rowMetrics = (rowCount) => {
  if (rowCount <= 30) return { rowHeight: 36, tickSize: 12 };
  if (rowCount <= 70) return { rowHeight: 30, tickSize: 11 };
  return { rowHeight: 26, tickSize: 10 };
};

const QualityMixChart = () => {
  const { data } = useDashboard();
  const d = data.current || [];

  const chartData = useMemo(() => {
    if (d.length === 0) return [];

    const sorted = [...d]
      .filter(row => row.N > 0 && row.name)
      .sort((a, b) => a.PDI - b.PDI || a.name.localeCompare(b.name))
      .reverse();

    return sorted.map(row => {
      const qualityTotal = Object.keys(QUALITY_CATEGORIES).reduce(
        (sum, key) => sum + (row[key] || 0), 0
      );
      const ratios = {};
      Object.keys(QUALITY_CATEGORIES).forEach(key => {
        ratios[key] = qualityTotal > 0 ? (row[key] || 0) / qualityTotal : 0;
      });

      return {
        name: `${row.name} (${row.V})`,
        PDI: row.PDI,
        pdi_color: pdiGradientColor(row.PDI, PDI_THRESHOLD),
        ...ratios,
      };
    });
  }, [d]);

  const rowCount = chartData.length;
  const { rowHeight, tickSize } = rowMetrics(rowCount);
  const chartHeight = Math.max(640, HEADER_PX + FOOTER_PX + rowHeight * rowCount);
  const longestName = chartData.reduce((m, r) => Math.max(m, r.name.length), 0);
  const leftMargin = Math.max(175, Math.min(560, 240 + longestName * 6));

  const belowCount = chartData.filter(r => r.PDI < PDI_THRESHOLD).length;
  const aboveCount = rowCount - belowCount;
  const qualityKeys = Object.keys(QUALITY_CATEGORIES);

  const chartTheme = {
    axis: { ticks: { text: { fontSize: tickSize, fill: '#263238' } } },
  };

  if (rowCount === 0) {
    return (
      <div className="glass u-container u-container--md qm-container">
        <h3 className="qm-title">رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان</h3>
        <p className="qm-empty">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  return (
    <div
      className="glass u-container u-container--md qm-container"
      style={{ '--qm-chart-height': `${chartHeight}px` }}
    >
      <h3 className="qm-title">رتبه‌بندی رزیدنت‌ها و توزیع کیفیت پرونده‌های آنان</h3>
      <p className="qm-subtitle">مرتب‌شده از کمترین امتیاز تا بیشترین امتیاز</p>

      <div className="qm-panels">
        <div className="qm-panel qm-panel-left">
          <div className="qm-panel-title">توزیع کیفیت پرونده‌ها</div>
          <div className="qm-chart-wrapper">
            <ResponsiveBar
              data={chartData}
              keys={qualityKeys}
              indexBy="name"
              layout="horizontal"
              margin={{ top: 10, right: 10, bottom: 40, left: leftMargin }}
              padding={0.15}
              theme={chartTheme}
              colors={({ id }) => QUALITY_CATEGORIES[id]?.color || '#ccc'}
              axisBottom={{
                legend: 'سهم از پرونده‌ها',
                legendPosition: 'middle',
                legendOffset: 30,
                format: v => `${Math.round(v * 100)}٪`,
                tickValues: [0, 0.2, 0.4, 0.6, 0.8, 1],
              }}
              axisLeft={{ tickSize: 5, tickPadding: 8, tickRotation: 0 }}
              enableLabel={false}
            />
          </div>
        </div>

        <div className="qm-panel qm-panel-right">
          <div className="qm-panel-title">امتیاز</div>
          <div className="qm-chart-wrapper">
            <ResponsiveBar
              data={chartData}
              keys={['PDI']}
              indexBy="name"
              layout="horizontal"
              margin={{ top: 10, right: 40, bottom: 40, left: 0 }}
              padding={0.15}
              theme={chartTheme}
              colors={({ data }) => data.pdi_color}
              axisBottom={{
                legend: 'امتیاز کیفیت ثبت پرونده‌ها',
                legendPosition: 'middle',
                legendOffset: 30,
                tickValues: [0, 25, 50, 75, 100],
              }}
              axisLeft={{ renderTick: () => null }}
              enableLabel={true}
              label={({ data }) => data.PDI.toFixed(1)}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              layers={[
                'grid',
                'axes',
                'bars',
                ({ xScale, innerHeight, innerWidth }) => {
                  const step = innerHeight / rowCount;
                  return (
                    <g>
                      <rect x={0} y={0} width={xScale(PDI_THRESHOLD)} height={innerHeight} fill="#D64545" opacity={0.05} />
                      <rect x={xScale(PDI_THRESHOLD)} y={0} width={innerWidth - xScale(PDI_THRESHOLD)} height={innerHeight} fill="#2E7D32" opacity={0.05} />
                      <line x1={xScale(PDI_THRESHOLD)} x2={xScale(PDI_THRESHOLD)} y1={0} y2={innerHeight} stroke="#37474F" strokeWidth={2.2} strokeDasharray="6 4" />
                      {belowCount > 0 && aboveCount > 0 && (
                        <line
                          x1={0} x2={innerWidth}
                          y1={aboveCount * step} y2={aboveCount * step}
                          stroke="#263238" strokeWidth={2.5} strokeDasharray="6 4"
                        />
                      )}
                    </g>
                  );
                }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="qm-status">
        <span className="qm-status-item qm-status-bad">غیر قابل قبول · {belowCount} نفر</span>
        <span className="qm-status-item qm-status-threshold">آستانه {PDI_THRESHOLD}</span>
        <span className="qm-status-item qm-status-good">قابل قبول · {aboveCount} نفر</span>
      </div>

      <ChartLegend
        items={qualityKeys.map(k => ({ label: QUALITY_CATEGORIES[k].label, color: QUALITY_CATEGORIES[k].color }))}
      />
    </div>
  );
};

export default QualityMixChart;