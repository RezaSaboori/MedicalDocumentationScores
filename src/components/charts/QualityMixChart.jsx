import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboard } from '../../context/DashboardContext';
import { QUALITY_CATEGORIES } from '../../utils/constants';
import { pdiGradientColor } from '../../utils/formatters';
import ChartLegend from './ChartLegend';
import './QualityMixChart.css';

const PDI_THRESHOLD = 50;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 40;
const TITLE_BLOCK = 24; // .qm-panel-title (20px) + margin (4px)

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
      .reverse(); // highest PDI on top, like the Python figure

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
  const chartHeight = Math.max(640, 96 + 140 + rowHeight * rowCount);
  const innerHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;
  const step = rowCount > 0 ? innerHeight / rowCount : 0;

  const longestName = chartData.reduce((m, r) => Math.max(m, r.name.length), 0);
  const leftMargin = Math.max(140, Math.min(320, 110 + longestName * 6));

  const belowCount = chartData.filter(r => r.PDI < PDI_THRESHOLD).length;
  const aboveCount = rowCount - belowCount;
  const showSeparator = belowCount > 0 && aboveCount > 0;
  const sepTop = TITLE_BLOCK + MARGIN_TOP + aboveCount * step;
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

      <div className="qm-panels" style={{ '--qm-sep-top': `${sepTop}px` }}>
        {showSeparator && <div className="qm-separator" />}

        <div className="qm-panel qm-panel-left">
          <div className="qm-panel-title">توزیع کیفیت پرونده‌ها</div>
          <div className="qm-chart-wrapper">
            <ResponsiveBar
              data={chartData}
              keys={qualityKeys}
              indexBy="name"
              layout="horizontal"
              margin={{ top: MARGIN_TOP, right: 10, bottom: MARGIN_BOTTOM, left: leftMargin }}
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
              margin={{ top: MARGIN_TOP, right: 40, bottom: MARGIN_BOTTOM, left: 0 }}
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
                ({ xScale, innerHeight: h, innerWidth }) => (
                  <g>
                    <rect x={0} y={0} width={xScale(PDI_THRESHOLD)} height={h} fill="#D64545" opacity={0.05} />
                    <rect x={xScale(PDI_THRESHOLD)} y={0} width={Math.max(0, innerWidth - xScale(PDI_THRESHOLD))} height={h} fill="#2E7D32" opacity={0.05} />
                    <line x1={xScale(PDI_THRESHOLD)} x2={xScale(PDI_THRESHOLD)} y1={0} y2={h} stroke="#37474F" strokeWidth={2.2} strokeDasharray="6 4" />
                  </g>
                ),
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