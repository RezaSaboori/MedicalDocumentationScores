import React from 'react';
import {
  formatRankChange,
  formatScoreChange,
} from '../../utils/comparison';
import ChartTooltip from './ChartTooltip';
import './QualityMixTooltip.css';

const formatInteger = (value) =>
  Number(value || 0).toLocaleString(
    'en-US'
  );

const QualityMixTooltip = ({
  row,
  categories,
  qualityKeys,
  positiveColor,
}) => {
  if (!row) {
    return null;
  }

  const classifiedCount =
    Number(row.raw?.N) || 0;

  const documentedCount =
    Number(row.raw?.D) || 0;

  const coverage =
    row.visitCount > 0
      ? documentedCount /
        row.visitCount
      : 0;

  const rankChange =
    row.rankChange != null
      ? formatRankChange(
          row.rankChange
        )
      : '—';

  const scoreChange =
    row.scoreChange != null
      ? formatScoreChange(
          row.scoreChange
        )
      : '—';

  const rankChangeColor =
    row.rankChange > 0
      ? positiveColor
      : row.rankChange < 0
        ? '#C62828'
        : '#90A4AE';

  const scoreChangeColor =
    row.scoreChange > 0
      ? positiveColor
      : row.scoreChange < 0
        ? '#C62828'
        : '#90A4AE';

  return (
    <ChartTooltip
      title={row.name}
      className="qm-rich-tooltip"
    >
      <div className="qm-rich-tooltip__headline">
        <span
          className={`qm-rich-tooltip__status ${
            row.status === 'قابل قبول'
              ? 'qm-rich-tooltip__status--good'
              : 'qm-rich-tooltip__status--bad'
          }`}
        >
          {row.status}
        </span>

        <span className="qm-rich-tooltip__rank">
          رتبه{' '}
          {row.currentRank ?? '—'}
        </span>
      </div>

      <div className="qm-rich-tooltip__stats">
        <div
          className="qm-rich-tooltip__stat"
          style={{
            '--qm-stat-color':
              row.barColor,
          }}
        >
          <span className="qm-rich-tooltip__stat-label">
            PDI
          </span>

          <strong className="qm-rich-tooltip__stat-value">
            {row.displayScore}
          </strong>
        </div>

        <div
          className="qm-rich-tooltip__stat"
          style={{
            '--qm-stat-color':
              row.calibratedColor,
          }}
        >
          <span className="qm-rich-tooltip__stat-label">
            میانگین نمره
          </span>

          <strong className="qm-rich-tooltip__stat-value">
            {row.displayCalibratedScore ??
              '—'}
          </strong>
        </div>

        <div
          className="qm-rich-tooltip__stat"
          style={{
            '--qm-stat-color':
              row.visitColor,
          }}
        >
          <span className="qm-rich-tooltip__stat-label">
            ویزیت
          </span>

          <strong className="qm-rich-tooltip__stat-value">
            {formatInteger(
              row.visitCount
            )}
          </strong>
        </div>

        <div
          className="qm-rich-tooltip__stat"
          style={{
            '--qm-stat-color':
              '#607D8B',
          }}
        >
          <span className="qm-rich-tooltip__stat-label">
            پرونده طبقه‌بندی‌شده
          </span>

          <strong className="qm-rich-tooltip__stat-value">
            {formatInteger(
              classifiedCount
            )}
          </strong>
        </div>
      </div>

      <div className="qm-rich-tooltip__section">
        <div className="qm-rich-tooltip__section-title">
          توزیع کیفیت پرونده‌ها
        </div>

        <table className="qm-rich-tooltip__table">
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
                  Number(
                    row.raw?.[key]
                  ) || 0;

                const ratio =
                  Number(
                    row[key]
                  ) || 0;

                return (
                  <tr key={key}>
                    <td>
                      <span className="qm-rich-tooltip__quality">
                        <span
                          className="qm-rich-tooltip__swatch"
                          style={{
                            backgroundColor:
                              categories[
                                key
                              ].color,
                          }}
                        />

                        {
                          categories[
                            key
                          ].label
                        }
                      </span>
                    </td>

                    <td className="qm-rich-tooltip__number">
                      {formatInteger(
                        count
                      )}
                    </td>

                    <td className="qm-rich-tooltip__number">
                      {Math.round(
                        ratio * 100
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

      <div className="qm-rich-tooltip__section">
        <div className="qm-rich-tooltip__section-title">
          جزئیات
        </div>

        <table className="qm-rich-tooltip__table qm-rich-tooltip__table--details">
          <tbody>
            <tr>
              <td>
                پرونده‌های مستند
              </td>
              <td className="qm-rich-tooltip__number">
                {formatInteger(
                  documentedCount
                )}
              </td>
            </tr>

            <tr>
              <td>
                پوشش مستندسازی
              </td>
              <td className="qm-rich-tooltip__number">
                {Math.round(
                  coverage * 100
                )}
                ٪
              </td>
            </tr>

            <tr>
              <td>
                تغییر رتبه نسبت به دوره قبل
              </td>
              <td
                className="qm-rich-tooltip__number"
                style={{
                  color:
                    rankChangeColor,
                }}
              >
                {rankChange}
              </td>
            </tr>

            <tr>
              <td>
                تغییر PDI نسبت به دوره قبل
              </td>
              <td
                className="qm-rich-tooltip__number"
                style={{
                  color:
                    scoreChangeColor,
                }}
              >
                {scoreChange}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ChartTooltip>
  );
};

export default QualityMixTooltip;