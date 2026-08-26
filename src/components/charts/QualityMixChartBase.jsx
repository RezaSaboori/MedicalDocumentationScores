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
const SCORE_PANEL_LEFT = 20;
// Constant right gutter, OUTSIDE the plot, reserved for score-change labels
const SCORE_CHANGE_GUTTER = 72;

const rowMetrics = (rowCount) => {
  if (rowCount <= 30) return { rowHeight: 36, tickSize: 12 };
  if (rowCount <= 70) return { rowHeight: 30, tickSize: 11 };
  return { rowHeight: 26, tickSize: 10 };
};

const QualityMixChartBase = ({
  rows,
  previousRows,
  comparisonRows,
  comparisonPreviousRows,
  scoreKey,
  categories,
  title,
  subtitle,
  positiveColor = '#049C49',
}) => {
  // Ranks/changes are computed over the full resident sets when provided
  // (faculty mode), so a supervised resident keeps the exact same numbers
  // as in the residents dashboard; only the visible rows are filtered.
  const comparison = useMemo(
    () => buildMonthComparison(
      comparisonRows || rows,
      comparisonPreviousRows || previousRows,
      scoreKey
    ),
    [comparisonRows, comparisonPreviousRows, rows, previousRows, scoreKey]
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
    // Proportional height: every row keeps the same bar height regardless of count
    const chartHeight = rowHeight * rowCount + MARGIN_TOP + MARGIN_BOTTOM;
    const innerHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;
    const step = rowCount > 0 ? innerHeight / rowCount : 0;

    const longest = chartData.reduce((m, r) => (r.name.length > m.length ? r.name : m), '');
    const labelWidth = measureTextWidth(longest, `${tickSize}px IRANSansX, IRANSansXV, sans-serif`);
    const leftMargin = Math.ceil(labelWidth) + TICK_SPACE + (hasComparison ? RANK_BADGE_SPACE : 0);

    const aboveCount = chartData.filter(r => r.score >= PDI_THRESHOLD).length;
    const belowCount = rowCount - aboveCount;
    const sepTop = TITLE_BLOCK + MARGIN_TOP + aboveCount * step;

    return {
      rowCount, tickSize, chartHeight, leftMargin,
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
        {(rankChange != null || hasComparison) && (
          <text
            x={-8 - Math.ceil(nameWidth) - 6}
            y={0}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={layout.tickSize}
            fontWeight={600}
            fill={rankChange != null ? changeColor(rankChange, positiveColor) : '#90A4AE'}
          >
            {rankChange != null ? formatRankChange(rankChange) : 'n/a'}
          </text>
        )}
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

  // Nivo renders data[0] at the BOTTOM; the HTML change-label column is
  // top-to-bottom, so reverse the order to keep rows aligned.
  const reversedChangeRows = useMemo(() => [...chartData].reverse(), [chartData]);

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
              minValue={0}
              maxValue={1}
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
            {/* Threshold zones: pure CSS over the exact plot area (0..100).
                The green edge == 100% == max bar length, by construction. */}
            <div
              className="qm-score-zones"
              style={{ top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: SCORE_PANEL_LEFT, right: SCORE_CHANGE_GUTTER }}
            >
              <div className="qm-score-zones__bad" />
              <div className="qm-score-zones__good" />
            </div>

            <ResponsiveBar
              data={chartData}
              keys={['score']}
              indexBy="name"
              layout="horizontal"
              margin={{ top: MARGIN_TOP, right: SCORE_CHANGE_GUTTER, bottom: MARGIN_BOTTOM, left: SCORE_PANEL_LEFT }}
              minValue={0}
              maxValue={SCORE_MAX}
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
            />

            {/* Score-change labels: HTML column in the reserved right gutter,
                always OUTSIDE the plot area. One flex cell per row, centered,
                matching Nivo's equal-height bands. */}
            {hasComparison && (
              <div
                className="qm-score-changes"
                style={{ top: MARGIN_TOP, bottom: MARGIN_BOTTOM, width: SCORE_CHANGE_GUTTER }}
              >
                {reversedChangeRows.map(row => (
                  <div key={`sc-${row.name}`} className="qm-score-changes__cell">
                    <span
                      style={{
                        color: row.scoreChange != null ? changeColor(row.scoreChange, positiveColor) : '#90A4AE',
                      }}
                    >
                      {row.scoreChange != null ? formatScoreChange(row.scoreChange) : 'n/a'}
                    </span>
                  </div>
                ))}
              </div>
            )}
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