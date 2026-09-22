import React, { useMemo, useState } from 'react';
import {
  pdiGradientColor,
  visitCountGradientColor,
} from '../../utils/formatters';
import { measureTextWidth } from '../../utils/textMeasure';
import {
  buildMonthComparison,
  buildCurrentRanks,
  formatRankChange,
  formatScoreChange,
  changeColor,
} from '../../utils/comparison';
import {
  calibratedScoreToQualityClass,
} from '../../utils/qualityClasses';
import {
  PDI_THRESHOLD,
} from '../../utils/constants';
import ChartContainer from './ChartContainer';
import QualityMixTooltip from './QualityMixTooltip';
import QualityMixLegendFooter from './QualityMixLegendFooter';
import QualityMixSortControl, {
  QUALITY_MIX_SORTS,
} from './QualityMixSortControl';
import './QualityMixChart.css';

const SCORE_MAX = 100;
const TICK_SPACE = 21;
const RANK_BADGE_SPACE = 34;
const META_BADGE_WIDTH = 60;
const SCORE_GUTTER = 72;

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
  positiveColor = '#049C49',
}) => {
  const [tooltip, setTooltip] = useState(null);

  const [sortBy, setSortBy] =
    useState(
      QUALITY_MIX_SORTS.SCORE
    );

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

  const currentRanks = useMemo(
    () =>
      buildCurrentRanks(
        comparisonRows || rows,
        scoreKey
      ),
    [comparisonRows, rows, scoreKey]
  );

  const chartData = useMemo(() => {
    const valid = (rows || [])
      .filter(
        (r) =>
          r &&
          r.name &&
          r.N > 0 &&
          r[scoreKey] != null &&
          !Number.isNaN(
            Number(r[scoreKey])
          )
      );

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
      const score = Math.min(
        SCORE_MAX,
        Math.max(
          0,
          Number(row[scoreKey])
        )
      );

      const normalizedName =
        String(row.name).trim();

      const displayScore =
        Math.ceil(score);

      const sourceCalibratedScore =
        row.calibrated_score;

      const calibratedScoreValue =
        sourceCalibratedScore ===
          null ||
        sourceCalibratedScore ===
          undefined ||
        sourceCalibratedScore ===
          ''
          ? null
          : Number(
              sourceCalibratedScore
            );

      const calibratedScore =
        Number.isFinite(
          calibratedScoreValue
        )
          ? Math.min(
              SCORE_MAX,
              Math.max(
                0,
                calibratedScoreValue
              )
            )
          : null;

      const displayCalibratedScore =
        calibratedScore != null
          ? Math.ceil(
              calibratedScore
            )
          : null;

      const calibratedClass =
        calibratedScore != null
          ? calibratedScoreToQualityClass(
              calibratedScore
            )
          : null;

      const calibratedCategory =
        calibratedClass != null
          ? categories[
              `Q${calibratedClass}`
            ] || {}
          : {};

      const visitCount =
        Math.max(
          0,
          Number(row.V) || 0
        );

      const cmp =
        comparison.get(
          normalizedName
        );

      return {
        name: normalizedName,
        currentRank:
          currentRanks.get(
            normalizedName
          ) ?? null,
        visitCount,
        visitColor:
          visitCountGradientColor(
            visitCount
          ),
        calibratedScore,
        displayCalibratedScore,
        calibratedColor:
          calibratedScore != null
            ? calibratedCategory.color ||
              '#B0BEC5'
            : '#ECEFF1',
        calibratedTextColor:
          calibratedScore != null
            ? calibratedCategory.textColor ||
              '#263238'
            : '#78909C',
        score,
        displayScore,
        barColor: pdiGradientColor(
          score,
          PDI_THRESHOLD
        ),
        status:
          score >= PDI_THRESHOLD
            ? 'قابل قبول'
            : 'غیر قابل قبول',
        rankChange:
          cmp?.rankChange ?? null,
        scoreChange:
          cmp?.scoreChange ?? null,
        raw: {
          ...row,
          ...counts,
        },
        ...ratios,
      };
    });
  }, [
    rows,
    scoreKey,
    categories,
    comparison,
    currentRanks,
  ]);

  const displayRows = useMemo(() => {
    const compareNames = (
      a,
      b
    ) =>
      a.name.localeCompare(
        b.name,
        'fa',
        {
          sensitivity: 'base',
        }
      );

    const normalizeNumber = (
      value
    ) => {
      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return null;
      }

      const numeric =
        Number(value);

      return Number.isFinite(
        numeric
      )
        ? numeric
        : null;
    };

    const compareDescending = (
      aValue,
      bValue
    ) => {
      const a =
        normalizeNumber(
          aValue
        );

      const b =
        normalizeNumber(
          bValue
        );

      if (
        a === null &&
        b === null
      ) {
        return 0;
      }

      if (a === null) {
        return 1;
      }

      if (b === null) {
        return -1;
      }

      return b - a;
    };

    return [...chartData].sort(
      (a, b) => {
        switch (sortBy) {
          case QUALITY_MIX_SORTS.VISITS:
            return (
              compareDescending(
                a.visitCount,
                b.visitCount
              ) ||
              compareNames(a, b)
            );

          case QUALITY_MIX_SORTS.CALIBRATED_SCORE:
            return (
              compareDescending(
                a.displayCalibratedScore,
                b.displayCalibratedScore
              ) ||
              compareDescending(
                a.calibratedScore,
                b.calibratedScore
              ) ||
              compareNames(a, b)
            );

          case QUALITY_MIX_SORTS.SCORE_CHANGE:
            return (
              compareDescending(
                a.scoreChange,
                b.scoreChange
              ) ||
              compareNames(a, b)
            );

          case QUALITY_MIX_SORTS.RANK_CHANGE:
            return (
              compareDescending(
                a.rankChange,
                b.rankChange
              ) ||
              compareNames(a, b)
            );

          case QUALITY_MIX_SORTS.ALPHABETICAL:
            return compareNames(
              a,
              b
            );

          case QUALITY_MIX_SORTS.SCORE:
          default:
            return (
              compareDescending(
                a.displayScore,
                b.displayScore
              ) ||
              compareDescending(
                a.score,
                b.score
              ) ||
              compareNames(a, b)
            );
        }
      }
    );
  }, [
    chartData,
    sortBy,
  ]);

  const layout = useMemo(() => {
    const rowCount = chartData.length;
    const { rowHeight, tickSize } = rowMetrics(rowCount);

    const longest = chartData.reduce(
      (currentLongest, row) => {
        const rankedName =
          row.currentRank != null
            ? `${row.currentRank}. ${row.name}`
            : row.name;

        return rankedName.length >
          currentLongest.length
          ? rankedName
          : currentLongest;
      },
      ''
    );

    const labelWidth =
      measureTextWidth(
        longest,
        `${tickSize}px IRANSansX, IRANSansXV, sans-serif`
      );

    const nameWidth =
      Math.ceil(labelWidth) +
      TICK_SPACE +
      12;

    const badgeWidth =
      hasComparison
        ? RANK_BADGE_SPACE
        : 0;

    const aboveCount =
      chartData.filter(
        (r) =>
          r.score >=
          PDI_THRESHOLD
      ).length;

    const belowCount =
      rowCount - aboveCount;

    const sepTop =
      aboveCount * rowHeight;

    return {
      rowCount,
      rowHeight,
      tickSize,
      nameWidth,
      badgeWidth,
      aboveCount,
      belowCount,
      sepTop,
      showSeparator:
        sortBy ===
          QUALITY_MIX_SORTS.SCORE &&
        aboveCount > 0 &&
        belowCount > 0,
    };
  }, [
    chartData,
    hasComparison,
    sortBy,
  ]);

  const qualityKeys = Object.keys(categories);

  const statusHeader = (
    <span className="qm-status qm-status--header">
      <span className="qm-status-item qm-status-good">
        قابل قبول · {layout.aboveCount} نفر
      </span>

      <span className="qm-status-item qm-status-bad">
        غیر قابل قبول · {layout.belowCount} نفر
      </span>
    </span>
  );

  if (layout.rowCount === 0) {
    return (
      <ChartContainer
        title={title}
        subtitle={statusHeader}
        className="qm-container"
        legendItems={[]}
      >
        <p className="qm-empty">داده‌ای برای نمایش وجود ندارد</p>
      </ChartContainer>
    );
  }

  const showTooltip = (row) =>
    setTooltip(row);

  const hideTooltip = () =>
    setTooltip(null);

  return (
    <ChartContainer
      title={title}
      subtitle={statusHeader}
      className="qm-container"
      legendItems={[]}
      headerActions={
        <QualityMixSortControl
          value={sortBy}
          onChange={
            setSortBy
          }
        />
      }
      footerContent={
        <QualityMixLegendFooter
          categories={categories}
          qualityKeys={qualityKeys}
          pdiThreshold={PDI_THRESHOLD}
          nameOffset={
            layout.badgeWidth +
            layout.nameWidth
          }
          metaWidth={
            META_BADGE_WIDTH
          }
          scoreGutter={
            SCORE_GUTTER
          }
        />
      }
    >
      <div
        className="qm-panels"
        style={{
          '--qm-sep-top': `${layout.sepTop}px`,
          '--qm-pdi-threshold': `${PDI_THRESHOLD}%`,
        }}
      >
        {layout.showSeparator && (
          <svg
            className="qm-separator"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              className="qm-separator__line"
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        <div className="qm-panel qm-panel-left">
          <div className="qm-rows">
            {displayRows.map(row => (
              <div key={row.name} className="qm-row" style={{ height: layout.rowHeight }}>
                <div
                  className="qm-name"
                  style={{
                    width:
                      layout.badgeWidth +
                      layout.nameWidth,
                    fontSize:
                      layout.tickSize,
                  }}
                >
                  {hasComparison && (
                    <span
                      className="qm-rank"
                      style={{
                        color:
                          row.rankChange != null
                            ? changeColor(
                                row.rankChange,
                                positiveColor
                              )
                            : '#90A4AE',
                      }}
                    >
                      {row.rankChange != null
                        ? formatRankChange(
                            row.rankChange
                          )
                        : 'n/a'}
                    </span>
                  )}

                  <span
                    className="qm-name-text"
                    title={row.name}
                  >
                    <span className="qm-physician-name">
                      {row.name}
                    </span>

                    {row.currentRank != null && (
                      <span className="qm-order">
                        .{row.currentRank}
                      </span>
                    )}
                  </span>
                </div>

                <div
                  className="qm-meta-cell"
                  style={{
                    width:
                      META_BADGE_WIDTH,
                    fontSize:
                      layout.tickSize,
                  }}
                  onMouseEnter={() =>
                    showTooltip(row)
                  }
                  onMouseLeave={
                    hideTooltip
                  }
                >
                  <div
                    className="qm-meta-badge"
                    style={{
                      backgroundColor:
                        row.calibratedColor,
                      color:
                        row.calibratedTextColor,
                    }}
                  >
                    {row.displayCalibratedScore != null
                      ? row.displayCalibratedScore.toLocaleString(
                          'en-US'
                        )
                      : '—'}
                  </div>
                </div>

                <div
                  className="qm-meta-cell"
                  style={{
                    width:
                      META_BADGE_WIDTH,
                    fontSize:
                      layout.tickSize,
                  }}
                  onMouseEnter={() =>
                    showTooltip(row)
                  }
                  onMouseLeave={
                    hideTooltip
                  }
                >
                  <div
                    className="qm-meta-badge"
                    style={{
                      backgroundColor:
                        row.visitColor,
                      color: '#FFFFFF',
                    }}
                  >
                    {row.visitCount.toLocaleString(
                      'en-US'
                    )}
                  </div>
                </div>

                <div
                  className="qm-mixbar"
                  onMouseEnter={() =>
                    showTooltip(row)
                  }
                  onMouseLeave={
                    hideTooltip
                  }
                >
                  {qualityKeys.map(k => row[k] > 0 && (
                    <div
                      key={k}
                      className="qm-mixbar__seg"
                      style={{ width: `${row[k] * 100}%`, backgroundColor: categories[k].color }}
                    >
                      {row[k] >= 0.06 && (
                        <span
                          style={{
                            color:
                              categories[k].textColor ||
                              '#263238',
                          }}
                        >
                          {Math.round(row[k] * 100)}٪
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>


        </div>

        <div className="qm-panel qm-panel-right">
          <div className="qm-score">
            <div className="qm-score__zones" style={{ right: SCORE_GUTTER }} />
            <div
              className="qm-score__threshold"
              style={{ right: SCORE_GUTTER }}
            >
              <svg
                className="qm-score__threshold-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line
                  className="qm-score__threshold-line"
                  x1={PDI_THRESHOLD}
                  y1="0"
                  x2={PDI_THRESHOLD}
                  y2="100"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <div className="qm-score__rows">
              {displayRows.map(row => (
                <div key={row.name} className="qm-row" style={{ height: layout.rowHeight }}>
                  <div
                    className="qm-scorebar-wrap"
                    onMouseEnter={() =>
                      showTooltip(row)
                    }
                    onMouseLeave={
                      hideTooltip
                    }
                  >
                    <div
                      className="qm-scorebar"
                      style={{ width: `${row.score}%`, backgroundColor: row.barColor }}
                    >
                      {row.score >= 15 && (
                        <span>
                          {row.displayScore}
                        </span>
                      )}
                    </div>
                    {row.score < 15 && (
                      <span
                        className="qm-scorebar__outside"
                        style={{
                          left:
                            `calc(${row.score}% + 4px)`,
                        }}
                      >
                        {row.displayScore}
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


        </div>
      </div>



      {tooltip && (
        <QualityMixTooltip
          row={tooltip}
          categories={categories}
          qualityKeys={qualityKeys}
          positiveColor={
            positiveColor
          }
        />
      )}
    </ChartContainer>
  );
};

export default QualityMixChartBase;