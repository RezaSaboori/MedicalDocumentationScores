import React, { useMemo, useState } from 'react';
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
const TITLE_BLOCK = 24; // panel title (20) + its margin (4)
const TICK_SPACE = 21;
const RANK_BADGE_SPACE = 34;
const SCORE_GUTTER = 72; // fixed right gutter for score-change labels
const AXIS_HEIGHT = 34;

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
  const [tooltip, setTooltip] = useState(null);

  // Ranks/changes over the full resident sets when provided (faculty mode),
  // so a supervised resident keeps the exact numbers of the residents dashboard.
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

  // Highest score at the top (data[0] was at the bottom in the Nivo version)
  const displayRows = useMemo(() => [...chartData].reverse(), [chartData]);

  const layout = useMemo(() => {
    const rowCount = chartData.length;
    const { rowHeight, tickSize } = rowMetrics(rowCount);

    const longest = chartData.reduce((m, r) => (r.name.length > m.length ? r.name : m), '');
    const labelWidth = measureTextWidth(longest, `${tickSize}px IRANSansX, IRANSansXV, sans-serif`);
    const nameWidth = Math.ceil(labelWidth) + TICK_SPACE;
    const badgeWidth = hasComparison ? RANK_BADGE_SPACE : 0;

    const aboveCount = chartData.filter(r => r.score >= PDI_THRESHOLD).length;
    const belowCount = rowCount - aboveCount;
    const sepTop = TITLE_BLOCK + aboveCount * rowHeight;

    return {
      rowCount, rowHeight, tickSize, nameWidth, badgeWidth,
      aboveCount, belowCount, sepTop,
      showSeparator: aboveCount > 0 && belowCount > 0,
    };
  }, [chartData, hasComparison]);

  const qualityKeys = Object.keys(categories);

  if (layout.rowCount === 0) {
    return (
      <div className="glass u-container u-container--md qm-container">
        <h3 className="qm-title">{title}</h3>
        <p className="qm-empty">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  const moveTooltip = (e, tipTitle, tipRows) =>
    setTooltip({ x: e.clientX, y: e.clientY, title: tipTitle, rows: tipRows });
  const hideTooltip = () => setTooltip(null);

  const mixTooltipRows = (row) => [
    ...qualityKeys.filter(k => row[k] > 0).map(k => ({
      label: categories[k].label,
      value: `${Math.round(row[k] * 100)}٪ (${Number(row.raw?.[k] ?? 0).toLocaleString('en-US')})`,
    })),
    { label: scoreKey, value: row.score.toFixed(1) },
    { label: 'وضعیت', value: row.status },
  ];

  const scoreTooltipRows = (row) => [
    { label: scoreKey, value: `${row.score.toFixed(1)}٪` },
    { label: 'وضعیت', value: row.status },
    { label: 'تعداد پرونده‌ها', value: Number(row.raw?.N ?? 0).toLocaleString('en-US') },
  ];

  return (
    <div className="glass u-container u-container--md qm-container">
      <h3 className="qm-title">{title}</h3>
      <p className="qm-subtitle">{subtitle}</p>

      <div className="qm-panels" style={{ '--qm-sep-top': `${layout.sepTop}px` }}>
        {layout.showSeparator && <div className="qm-separator" />}

        <div className="qm-panel qm-panel-left">
          <div className="qm-panel-title">توزیع کیفیت پرونده‌ها</div>

          <div className="qm-rows">
            {displayRows.map(row => (
              <div key={row.name} className="qm-row" style={{ height: layout.rowHeight }}>
                <div
                  className="qm-name"
                  style={{ width: layout.badgeWidth + layout.nameWidth, fontSize: layout.tickSize }}
                >
                  {hasComparison && (
                    <span
                      className="qm-rank"
                      style={{ color: row.rankChange != null ? changeColor(row.rankChange, positiveColor) : '#90A4AE' }}
                    >
                      {row.rankChange != null ? formatRankChange(row.rankChange) : 'n/a'}
                    </span>
                  )}
                  <span className="qm-name-text" title={row.name}>{row.name}</span>
                </div>

                <div
                  className="qm-mixbar"
                  onMouseMove={(e) => moveTooltip(e, row.name, mixTooltipRows(row))}
                  onMouseLeave={hideTooltip}
                >
                  {qualityKeys.map(k => row[k] > 0 && (
                    <div
                      key={k}
                      className="qm-mixbar__seg"
                      style={{ width: `${row[k] * 100}%`, backgroundColor: categories[k].color }}
                    >
                      {row[k] >= 0.06 && (
                        <span style={{ color: ['A', 'E', 'F'].includes(k) ? '#ffffff' : '#263238' }}>
                          {Math.round(row[k] * 100)}٪
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="qm-axis" style={{ marginLeft: layout.badgeWidth + layout.nameWidth, height: AXIS_HEIGHT }}>
            {[0, 20, 40, 60, 80, 100].map(t => (
              <span key={t} className="qm-axis__tick" style={{ left: `${t}%`, fontSize: layout.tickSize }}>
                {t}٪
              </span>
            ))}
            <span className="qm-axis__legend" style={{ fontSize: layout.tickSize }}>سهم از پرونده‌ها</span>
          </div>
        </div>

        <div className="qm-panel qm-panel-right">
          <div className="qm-panel-title">امتیاز</div>

          <div className="qm-score">
            {/* 0..50 red / 50..100 green; right edge == 100% == max bar length */}
            <div className="qm-score__zones" style={{ right: SCORE_GUTTER }} />
            {/* 50% threshold line, rendered above the score bars */}
            <div className="qm-score__threshold" style={{ right: SCORE_GUTTER }} />

            <div className="qm-score__rows">
              {displayRows.map(row => (
                <div key={row.name} className="qm-row" style={{ height: layout.rowHeight }}>
                  <div
                    className="qm-scorebar-wrap"
                    onMouseMove={(e) => moveTooltip(e, row.name, scoreTooltipRows(row))}
                    onMouseLeave={hideTooltip}
                  >
                    <div
                      className="qm-scorebar"
                      style={{ width: `${row.score}%`, backgroundColor: row.barColor }}
                    >
                      {row.score >= 15 && <span>{row.score.toFixed(1)}</span>}
                    </div>
                    {row.score < 15 && (
                      <span className="qm-scorebar__outside" style={{ left: `calc(${row.score}% + 4px)` }}>
                        {row.score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div
                    className="qm-change"
                    style={{ width: SCORE_GUTTER, fontSize: Math.max(10, layout.tickSize - 1) }}
                  >
                    {hasComparison && (
                      <span style={{ color: row.scoreChange != null ? changeColor(row.scoreChange, positiveColor) : '#90A4AE' }}>
                        {row.scoreChange != null ? formatScoreChange(row.scoreChange) : 'n/a'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="qm-axis" style={{ marginRight: SCORE_GUTTER, height: AXIS_HEIGHT }}>
            {[0, 25, 50, 75, 100].map(t => (
              <span key={t} className="qm-axis__tick" style={{ left: `${t}%`, fontSize: layout.tickSize }}>
                {t}٪
              </span>
            ))}
            <span className="qm-axis__legend" style={{ fontSize: layout.tickSize }}>امتیاز کیفیت ثبت پرونده‌ها</span>
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

      {tooltip && (
        <div className="qm-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <ChartTooltip title={tooltip.title} rows={tooltip.rows} />
        </div>
      )}
    </div>
  );
};

export default QualityMixChartBase;