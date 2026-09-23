import React from 'react';
import ChartTooltip from './ChartTooltip';
import {
  QUALITY_CATEGORIES,
  PDI_THRESHOLD,
} from '../../utils/constants';
import {
  calibratedScoreToQualityClass,
} from '../../utils/qualityClasses';
import {
  pdiGradientColor,
  visitCountGradientColor,
} from '../../utils/formatters';
import {
  changeColor,
  formatRankChange,
  formatScoreChange,
} from '../../utils/comparison';
import './QualityMixTooltip.css';
import './PhysicianTrendTooltip.css';

const POSITIVE_COLOR =
  '#15C062';

const toFiniteNumber = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const formatInteger = (
  value
) =>
  Number(
    value || 0
  ).toLocaleString(
    'en-US'
  );

const PhysicianTrendTooltip = ({
  title,
  columns = [],
  rows = [],
  qualityRow = null,
}) => {
  const qualityKeys =
    Object.keys(
      QUALITY_CATEGORIES
    );

  const score =
    qualityRow
      ? toFiniteNumber(
          qualityRow.PDI
        )
      : null;

  const calibratedScore =
    qualityRow
      ? toFiniteNumber(
          qualityRow
            .calibrated_score
        )
      : null;

  const visitCount =
    qualityRow
      ? Math.max(
          0,
          Number(
            qualityRow.V
          ) || 0
        )
      : 0;

  const documentedCount =
    qualityRow
      ? Math.max(
          0,
          Number(
            qualityRow.D
          ) || 0
        )
      : 0;

  const coverage =
    visitCount > 0
      ? documentedCount /
        visitCount
      : 0;

  const qualityCounts =
    qualityRow
      ? Object.fromEntries(
          qualityKeys.map(
            (key) => [
              key,
              Math.max(
                0,
                Number(
                  qualityRow[key]
                ) || 0
              ),
            ]
          )
        )
      : {};

  const qualityTotal =
    qualityKeys.reduce(
      (sum, key) =>
        sum +
        (
          qualityCounts[
            key
          ] || 0
        ),
      0
    );

  const calibratedClass =
    calibratedScore !== null
      ? calibratedScoreToQualityClass(
          calibratedScore
        )
      : null;

  const calibratedCategory =
    calibratedClass !== null
      ? QUALITY_CATEGORIES[
          `Q${calibratedClass}`
        ] || {}
      : {};

  const rankChange =
    qualityRow
      ? toFiniteNumber(
          qualityRow
            .rank_change
        )
      : null;

  const scoreChange =
    qualityRow
      ? toFiniteNumber(
          qualityRow
            .score_change
        )
      : null;

  const hasQualityData =
    Boolean(
      qualityRow
    );

  return (
    <ChartTooltip
      title={title}
      className="physician-trend-tooltip qm-rich-tooltip"
    >
      {hasQualityData && (
        <>
          <div className="qm-rich-tooltip__headline">
            <span
              className={`qm-rich-tooltip__status ${
                score !== null &&
                score >=
                  PDI_THRESHOLD
                  ? 'qm-rich-tooltip__status--good'
                  : 'qm-rich-tooltip__status--bad'
              }`}
            >
              {score !== null &&
              score >=
                PDI_THRESHOLD
                ? 'قابل قبول'
                : 'غیر قابل قبول'}
            </span>

            <span className="qm-rich-tooltip__rank">
              رتبه{' '}
              {qualityRow
                .current_rank ??
                '—'}
            </span>
          </div>

          <div className="qm-rich-tooltip__stats">
            <div
              className="qm-rich-tooltip__stat"
              style={{
                '--qm-stat-color':
                  score !== null
                    ? pdiGradientColor(
                        score,
                        PDI_THRESHOLD
                      )
                    : '#B0BEC5',
              }}
            >
              <span className="qm-rich-tooltip__stat-label">
                PDI
              </span>

              <strong className="qm-rich-tooltip__stat-value">
                {score !== null
                  ? Math.ceil(
                      score
                    )
                  : '—'}
              </strong>
            </div>

            <div
              className="qm-rich-tooltip__stat"
              style={{
                '--qm-stat-color':
                  calibratedScore !==
                  null
                    ? calibratedCategory
                        .color ||
                      '#B0BEC5'
                    : '#B0BEC5',
              }}
            >
              <span className="qm-rich-tooltip__stat-label">
                میانگین نمره
              </span>

              <strong className="qm-rich-tooltip__stat-value">
                {calibratedScore !==
                null
                  ? Math.ceil(
                      calibratedScore
                    )
                  : '—'}
              </strong>
            </div>

            <div
              className="qm-rich-tooltip__stat"
              style={{
                '--qm-stat-color':
                  visitCountGradientColor(
                    visitCount
                  ),
              }}
            >
              <span className="qm-rich-tooltip__stat-label">
                ویزیت
              </span>

              <strong className="qm-rich-tooltip__stat-value">
                {formatInteger(
                  visitCount
                )}
              </strong>
            </div>
          </div>
        </>
      )}

      <div className="physician-trend-tooltip__section">
        <table className="physician-trend-tooltip__table physician-trend-tooltip__table--comparison">
          <thead>
            <tr>
              {columns.map(
                (column) => (
                  <th key={column}>
                    {column}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (row) => (
                <tr key={row.label}>
                  <td>
                    <span className="physician-trend-tooltip__metric">
                      {row.color && (
                        <span
                          className="physician-trend-tooltip__swatch"
                          style={{
                            backgroundColor:
                              row.color,
                          }}
                        />
                      )}

                      <span>
                        {row.label}
                      </span>
                    </span>
                  </td>

                  {row.values.map(
                    (
                      value,
                      index
                    ) => (
                      <td
                        key={`${row.label}-${index}`}
                        className="physician-trend-tooltip__value"
                      >
                        {value}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {hasQualityData && (
        <>
          <div className="physician-trend-tooltip__section">
            <div className="physician-trend-tooltip__section-title">
              توزیع کیفیت پرونده‌ها
            </div>

            <table className="physician-trend-tooltip__table physician-trend-tooltip__table--quality">
              <thead>
                <tr>
                  <th>سطح</th>
                  <th>تعداد</th>
                  <th>سهم</th>
                </tr>
              </thead>

              <tbody>
                {qualityKeys.map(
                  (key) => {
                    const count =
                      qualityCounts[
                        key
                      ] || 0;

                    const ratio =
                      qualityTotal > 0
                        ? count /
                          qualityTotal
                        : 0;

                    return (
                      <tr key={key}>
                        <td>
                          <span className="physician-trend-tooltip__metric">
                            <span
                              className="physician-trend-tooltip__swatch"
                              style={{
                                backgroundColor:
                                  QUALITY_CATEGORIES[
                                    key
                                  ].color,
                              }}
                            />

                            <span>
                              {
                                QUALITY_CATEGORIES[
                                  key
                                ].label
                              }
                            </span>
                          </span>
                        </td>

                        <td className="physician-trend-tooltip__value">
                          {formatInteger(
                            count
                          )}
                        </td>

                        <td className="physician-trend-tooltip__value">
                          {Math.round(
                            ratio *
                              100
                          )}
                          ٪
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          <div className="physician-trend-tooltip__section">
            <div className="physician-trend-tooltip__section-title">
              جزئیات
            </div>

            <table className="physician-trend-tooltip__table physician-trend-tooltip__table--details">
              <tbody>
                <tr>
                  <td>
                    پرونده‌های مستند
                  </td>

                  <td className="physician-trend-tooltip__value">
                    {formatInteger(
                      documentedCount
                    )}
                  </td>
                </tr>

                <tr>
                  <td>
                    پوشش مستندسازی
                  </td>

                  <td className="physician-trend-tooltip__value">
                    {Math.round(
                      coverage *
                        100
                    )}
                    ٪
                  </td>
                </tr>

                <tr>
                  <td>
                    تغییر رتبه نسبت به دوره قبل
                  </td>

                  <td
                    className="physician-trend-tooltip__value"
                    style={{
                      color:
                        rankChange !==
                          null
                          ? changeColor(
                              rankChange,
                              POSITIVE_COLOR
                            )
                          : '#90A4AE',
                    }}
                  >
                    {rankChange !==
                    null
                      ? formatRankChange(
                          rankChange
                        )
                      : '—'}
                  </td>
                </tr>

                <tr>
                  <td>
                    تغییر امتیاز کیفیت ثبت نسبت به دوره قبل
                  </td>

                  <td
                    className="physician-trend-tooltip__value"
                    style={{
                      color:
                        scoreChange !==
                          null
                          ? changeColor(
                              scoreChange,
                              POSITIVE_COLOR
                            )
                          : '#90A4AE',
                    }}
                  >
                    {scoreChange !==
                    null
                      ? formatScoreChange(
                          scoreChange
                        )
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </ChartTooltip>
  );
};

export default PhysicianTrendTooltip;