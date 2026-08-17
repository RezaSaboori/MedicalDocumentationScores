import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { pdiGradientColor } from '../../utils/formatters';
import { measureTextWidth } from '../../utils/textMeasure';
import {
  buildMonthComparison,
  formatRankChange,
  formatScoreChange,
  changeColor,
} from '../../utils/comparison';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import './QualityMixChart.css';

const PDI_THRESHOLD = 50;
const SCORE_MAX = 100;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 40;
const TITLE_BLOCK = 24;
const TICK_SPACE = 21;
const RANK_BADGE_SPACE = 34;

const rowMetrics = (rowCount) => {
  if (rowCount <= 30) return { rowHeight: 36, tickSize: 12 };
  if (rowCount <= 70) return { rowHeight: 30, tickSize: 11 };
  return { rowHeight: 26, tickSize: 10 };
};

const QualityMixChartBase = ({
  rows,
  previousRows,
  scoreKey,
  categories,
  title,
  subtitle,
  positiveColor = '#049C49',
}) => {
  const comparison = useMemo(
    () => buildMonthComparison(rows, previousRows, scoreKey),
    [rows, previousRows, scoreKey]
  );
  const hasComparison = comparison.size > 0;

  const chartData = useMemo(() => {
    const valid = (rows || [])
      .filter(r => r && r.name && r.N > 0 && r[scoreKey] != null && !Number.isNaN(Number(r[scoreKey])))
      .sort((a, b) => Number(a[scoreKey]) - Number(b[scoreKey]) || String(a.name).localeCompare(String(b.name)));

    // NOTE: no reverse — Nivo renders data[0] at the BOTTOM (like the Python figure).
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
      const cmp = comparison.get(String(row.name).trim());
      return {
        name: `${row.name} (${row.V})`,
        score,
        barColor: pdiGradientColor(score, PDI_THRESHOLD),
        status: score >= PDI_THRESHOLD ? 'قابل قبول' : 'غیر قابل قبول',
        rankChange: cmp?.rankChange ?? null,
        scoreChange: cmp?.scoreChange ?? null,
        raw: { ...row, ...counts },
        ...ratios,
      };
    });
  }, [rows, scoreKey, categories, comparison]);

  const layout = useMemo(() => {
    const rowCount = chartData.length;
    const { rowHeight, tickSize } = rowMetrics(rowCount);
    const chartHeight = Math.max(640, 96 + 140 + rowHeight * rowCount);
    const innerHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;
    const step = rowCount > 0 ? innerHeight / rowCount : 0;

    const longest = chartData.reduce((m, r) => (r.name.length > m.length ? r.name : m), '');
    const labelWidth = measureTextWidth(longest, `${tickSize}px IRANSansX, IRANSansXV, sans-serif`);
    const leftMargin = Math.ceil(labelWidth) + TICK_SPACE + (hasComparison ? RANK_BADGE_SPACE : 0);
    const rightMargin = hasComparison ? 92 : 24; // room for score-change labels

    const aboveCount = chartData.filter(r => r.score >= PDI_THRESHOLD).length;
    const belowCount = rowCount - aboveCount;
    const sepTop = TITLE_BLOCK + MARGIN_TOP + aboveCount * step;

    return {
      rowCount, tickSize, chartHeight, leftMargin, rightMargin,
      aboveCount, belowCount, sepTop,
      showSeparator: aboveCount > 0 && belowCount > 0,
    };
  }, [chartData, hasComparison]);

  const tickRank = useMemo(
    () => new Map(chartData.map(r => [r.name, r.rankChange])),
    [chartData]
  );

  const qualityKeys = Object.keys(categories);
  const chartTheme = { axis: { ticks: { text: { fontSize: layout.tickSize, fill: '#263238' } } } };
  const ratioTick = (v) => `${Math.round(v * 100)}٪`;
  const scoreTick = (v) => `${v}٪`;
  const font = `${layout.tickSize}px IRANSansX, IRANSansXV, sans-serif`;

  if (layout.rowCount === 0) {
    return (
      <div className="glass u-container u-container--md qm-container">
        <h3 className="qm-title">{title}</h3>
        <p className="qm-empty">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  // Y-axis tick: name + colored rank-change badge (like the Python HTML tick labels)
  const renderNameTick = (tickProps) => {
    const label = String(tickProps.value ?? tickProps.tick ?? '');
    const x = tickProps.x ?? 0;
    const y = tickProps.y ?? 0;
    const rankChange = tickRank.get(label);
    const nameWidth = measureTextWidth(label, font);
    return (
      <g key={label} transform={`translate(${x},${y})`}>
        <line x1={-5} x2={0} y1={0} y2={0} stroke="#90A4AE" />
        <text x={-8} y={0} textAnchor="end" dominantBaseline="central" fontSize={layout.tickSize} fill="#263238">
          {label}
        </text>
        {rankChange != null && (
          <text
            x={-8 - Math.ceil(nameWidth) - 6}
            y={0}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={layout.tickSize}
            fontWeight={600}
            fill={changeColor(rankChange, positiveColor)}
          >
            {formatRankChange(rankChange)}
          </text>
        )}
      </g>
    );
  };

  // Score-change labels at the right edge of the score panel
  const ScoreChangesLayer = ({ yScale, innerWidth }) => (
    <g>
      {chartData.map(row => {
        if (row.scoreChange == null) return null;
        const band = typeof yScale.bandwidth === 'function' ? yScale.bandwidth() : 0;
        const y = (yScale(row.name) ?? 0) + band / 2;
        return (
          <text
            key={`sc-${row.name}`}
            x={innerWidth + 10}
            y={y}
            textAnchor="start"
            dominantBaseline="central"
            fontSize={Math.max(10, layout.tickSize - 1)}
            fill={changeColor(row.scoreChange, positiveColor)}
          >
            {formatScoreChange(row.scoreChange)}
          </text>
        );
      })}
    </g>
  );

  // Threshold zones derived from the scale (always end exactly at the 100٪ tick)
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
              axisLeft={{ renderTick: renderNameTick }}
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
              margin={{ top: MARGIN_TOP, right: layout.rightMargin, bottom: MARGIN_BOTTOM, left: 0 }}
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
                (layerProps) => <ScoreChangesLayer key="score-changes" {...layerProps} />,
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