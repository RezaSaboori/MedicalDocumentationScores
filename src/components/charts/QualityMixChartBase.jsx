import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { pdiGradientColor } from '../../utils/formatters';
import { measureTextWidth } from '../../utils/textMeasure';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import './QualityMixChart.css';

const PDI_THRESHOLD = 50;
const SCORE_MAX = 100;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 40;
const TITLE_BLOCK = 24;  // .qm-panel-title (20px) + margin-bottom (4px)
const TICK_SPACE = 21;   // ticklen(5) + tickPadding(8) + safety(8)

const rowMetrics = (rowCount) => {
  if (rowCount <= 30) return { rowHeight: 36, tickSize: 12 };
  if (rowCount <= 70) return { rowHeight: 30, tickSize: 11 };
  return { rowHeight: 26, tickSize: 10 };
};

const QualityMixChartBase = ({ rows, scoreKey, categories, title, subtitle }) => {
  // Re-measure margins once the Persian webfont is actually loaded
  const [, setFontsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (alive) setFontsReady(true); });
    }
    return () => { alive = false; };
  }, []);

  const chartData = useMemo(() => {
    const valid = (rows || [])
      .filter(r => r && r.name && r.N > 0 && r[scoreKey] != null && !Number.isNaN(Number(r[scoreKey])))
      .sort((a, b) => Number(a[scoreKey]) - Number(b[scoreKey]) || String(a.name).localeCompare(String(b.name)));

    // NOTE: do NOT reverse. Nivo horizontal bars render data[0] at the BOTTOM,
    // so ascending sort yields lowest-at-bottom / highest-at-top (like Python).
    return valid.map(row => {
      const counts = {};
      let total = 0;
      Object.keys(categories).forEach(k => {
        counts[k] = Math.max(0, Number(row[k]) || 0);
        total += counts[k];
      });
      const ratios = {};
      Object.keys(categories).forEach(k => {
        ratios[k] = total > 0 ? counts[k] / total : 0;
      });
      const score = Math.min(SCORE_MAX, Math.max(0, Number(row[scoreKey])));
      return {
        name: `${row.name} (${row.V})`,
        score,
        barColor: pdiGradientColor(score, PDI_THRESHOLD),
        status: score >= PDI_THRESHOLD ? 'قابل قبول' : 'غیر قابل قبول',
        raw: { ...row, ...counts },
        ...ratios,
      };
    });
  }, [rows, scoreKey, categories]);

  const layout = useMemo(() => {
    const rowCount = chartData.length;
    const { rowHeight, tickSize } = rowMetrics(rowCount);
    const chartHeight = Math.max(640, 96 + 140 + rowHeight * rowCount);
    const innerHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;
    const step = rowCount > 0 ? innerHeight / rowCount : 0;

    // Exact left margin: measured width of the longest tick label
    const longest = chartData.reduce((m, r) => (r.name.length > m.length ? r.name : m), '');
    const labelWidth = measureTextWidth(longest, `${tickSize}px IRANSansX, IRANSansXV, sans-serif`);
    const leftMargin = Math.ceil(labelWidth) + TICK_SPACE;

    const aboveCount = chartData.filter(r => r.score >= PDI_THRESHOLD).length;
    const belowCount = rowCount - aboveCount;

    // Render order is lowest-at-bottom => the top `aboveCount` rows are the
    // >=50 group => boundary from the TOP of the plot = aboveCount * step.
    const sepTop = TITLE_BLOCK + MARGIN_TOP + aboveCount * step;

    return {
      rowCount, tickSize, chartHeight, leftMargin,
      aboveCount, belowCount, sepTop,
      showSeparator: aboveCount > 0 && belowCount > 0,
    };
  }, [chartData]);

  const qualityKeys = Object.keys(categories);
  const chartTheme = { axis: { ticks: { text: { fontSize: layout.tickSize, fill: '#263238' } } } };
  const ratioTick = (v) => `${Math.round(v * 100)}٪`;
  const scoreTick = (v) => `${v}٪`;

  if (layout.rowCount === 0) {
    return (
      <div className="glass u-container u-container--md qm-container">
        <h3 className="qm-title">{title}</h3>
        <p className="qm-empty">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  const MixTooltip = ({ id, indexValue, value, data }) => (
    <ChartTooltip
      title={indexValue}
      rows={[
        { label: 'سطح کیفیت', value: categories[id]?.label ?? id },
        { label: 'تعداد در این سطح', value: Number(data.raw?.[id] ?? 0).toLocaleString('en-US') },
        { label: 'سهم از پرونده‌ها', value: `${Math.round(value * 100)}٪` },
        { label: scoreKey, value: data.score.toFixed(1) },
        { label: 'وضعیت', value: data.status },
      ]}
    />
  );

  const ScoreTooltip = ({ indexValue, data }) => (
    <ChartTooltip
      title={indexValue}
      rows={[
        { label: scoreKey, value: `${data.score.toFixed(1)}٪` },
        { label: 'وضعیت', value: data.status },
        { label: 'تعداد پرونده‌ها', value: Number(data.raw?.N ?? 0).toLocaleString('en-US') },
      ]}
    />
  );

  // Zones are derived from the SCALE (not innerWidth) so they always end
  // exactly at the 100٪ tick, whatever the rendered plot width is.
  const ScoreZonesLayer = ({ xScale, innerHeight }) => {
    const x0 = xScale(0);
    const xT = xScale(PDI_THRESHOLD);
    const xEnd = xScale(SCORE_MAX);
    return (
      <g>
        <rect x={x0} y={0} width={Math.max(0, xT - x0)} height={innerHeight} fill="#D64545" opacity={0.055} />
        <rect x={xT} y={0} width={Math.max(0, xEnd - xT)} height={innerHeight} fill="#2E7D32" opacity={0.055} />
        <line x1={xT} x2={xT} y1={0} y2={innerHeight} stroke="#37474F" strokeWidth={2.2} strokeDasharray="6 4" />
      </g>
    );
  };

  return (
    <div
      className="glass u-container u-container--md qm-container"
      style={{ '--qm-chart-height': `${layout.chartHeight}px` }}
    >
      <h3 className="qm-title">{title}</h3>
      <p className="qm-subtitle">{subtitle}</p>

      <div className="qm-panels" style={{ '--qm-sep-top': `${layout.sepTop}px` }}>
        {layout.showSeparator && <div className="qm-separator" />}

        <div className="qm-panel qm-panel-left">
          <div className="qm-panel-title">توزیع کیفیت پرونده‌ها</div>
          <div className="qm-chart-wrapper">
            <ResponsiveBar
              data={chartData}
              keys={qualityKeys}
              indexBy="name"
              layout="horizontal"
              margin={{ top: MARGIN_TOP, right: 16, bottom: MARGIN_BOTTOM, left: layout.leftMargin }}
              xScale={{ type: 'linear', min: 0, max: 1 }}
              padding={0.15}
              theme={chartTheme}
              colors={({ id }) => categories[id]?.color || '#ccc'}
              enableLabel={true}
              label={({ value }) => (value >= 0.06 ? `${Math.round(value * 100)}٪` : '')}
              labelTextColor={({ id }) => (['A', 'E', 'F'].includes(id) ? '#ffffff' : '#263238')}
              axisBottom={{
                legend: 'سهم از پرونده‌ها',
                legendPosition: 'middle',
                legendOffset: 30,
                format: ratioTick,
                tickValues: [0, 0.2, 0.4, 0.6, 0.8, 1],
              }}
              axisLeft={{ tickSize: 5, tickPadding: 8, tickRotation: 0 }}
              tooltip={MixTooltip}
            />
          </div>
        </div>

        <div className="qm-panel qm-panel-right">
          <div className="qm-panel-title">امتیاز</div>
          <div className="qm-chart-wrapper">
            <ResponsiveBar
              data={chartData}
              keys={['score']}
              indexBy="name"
              layout="horizontal"
              margin={{ top: MARGIN_TOP, right: 40, bottom: MARGIN_BOTTOM, left: 8 }}
              xScale={{ type: 'linear', min: 0, max: SCORE_MAX }}
              padding={0.15}
              theme={chartTheme}
              colors={({ data }) => data.barColor}
              enableLabel={true}
              label={({ data }) => data.score.toFixed(1)}
              labelTextColor={({ data }) => (data.score >= 15 ? '#ffffff' : '#263238')}
              axisBottom={{
                legend: 'امتیاز کیفیت ثبت پرونده‌ها',
                legendPosition: 'middle',
                legendOffset: 30,
                format: scoreTick,
                tickValues: [0, 25, 50, 75, 100],
              }}
              axisLeft={{ renderTick: () => null }}
              tooltip={ScoreTooltip}
              layers={[
                'grid',
                'axes',
                'bars',
                (layerProps) => <ScoreZonesLayer key="zones" {...layerProps} />,
              ]}
            />
          </div>
        </div>
      </div>

      <div className="qm-status">
        <span className="qm-status-item qm-status-bad">غیر قابل قبول · {layout.belowCount} نفر</span>
        <span className="qm-status-item qm-status-threshold">آستانه {PDI_THRESHOLD}</span>
        <span className="qm-status-item qm-status-good">قابل قبول · {layout.aboveCount} نفر</span>
      </div>

      <ChartLegend
        items={qualityKeys.map(k => ({ label: categories[k].label, color: categories[k].color }))}
      />
    </div>
  );
};

export default QualityMixChartBase;