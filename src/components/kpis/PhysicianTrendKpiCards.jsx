import React from 'react';
import {
  PDI_THRESHOLD,
} from '../../utils/constants';
import {
  formatNumber,
  pdiGradientColor,
} from '../../utils/formatters';
import KpiMiniTrend from './KpiMiniTrend';
import './PhysicianTrendKpiCards.css';

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

const formatPdi = (
  value
) => {
  const number =
    toFiniteNumber(
      value
    );

  return number !== null
    ? number.toFixed(1)
    : '—';
};

const getRowMetric = (
  row,
  key
) => {
  if (
    !row ||
    row.row_id === null
  ) {
    return null;
  }

  return toFiniteNumber(
    row[key]
  );
};

const formatChange = (
  value,
  digits = 0
) => {
  if (
    value === null
  ) {
    return '—';
  }

  const absolute =
    Math.abs(value);

  if (
    digits > 0
  ) {
    return absolute.toFixed(
      digits
    );
  }

  return formatNumber(
    absolute,
    0
  );
};

const ChangeChevron = ({
  direction,
}) => {
  if (
    direction ===
    'flat'
  ) {
    return (
      <span className="physician-trend-kpi__change-flat">
        —
      </span>
    );
  }

  if (
    direction !==
      'up' &&
    direction !==
      'down'
  ) {
    return null;
  }

  return (
    <svg
      className="physician-trend-kpi__change-icon"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      {direction ===
      'up' ? (
        <path
          d="M2.5 7.5 6 4l3.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2.5 4.5 6 8l3.5-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

const PhysicianTrendKpiCards = ({
  row,
  data = [],
}) => {
  if (!row) {
    return null;
  }

  const currentIndex =
    data.findIndex(
      (item) =>
        item.period ===
        row.period
    );

  const previousRow =
    currentIndex > 0
      ? data[
          currentIndex -
            1
        ]
      : null;

  const trendRows =
    currentIndex >= 0
      ? [
          currentIndex -
            2,
          currentIndex -
            1,
          currentIndex,
        ].map(
          (index) =>
            index >= 0
              ? data[
                  index
                ]
              : null
        )
      : [
          null,
          null,
          row,
        ];

  const pdi =
    toFiniteNumber(
      row.PDI
    );

  const cardConfigs = [
    {
      key: 'rank',
      title: 'رتبه',
      dataKey:
        'current_rank',

      value:
        row.current_rank ??
        '—',

      color:
        'var(--color-blue)',

      lowerIsBetter:
        true,

      changeDigits:
        0,
    },

    {
      key: 'visits',
      title: 'ویزیت',
      dataKey: 'V',

      value:
        getRowMetric(
          row,
          'V'
        ) !== null
          ? formatNumber(
              row.V,
              0
            )
          : '—',

      color:
        'var(--color-blue)',

      lowerIsBetter:
        false,

      changeDigits:
        0,
    },

    {
      key: 'pdi',
      title:
        'امتیاز کیفیت ثبت پرونده‌ها',
      dataKey: 'PDI',

      value:
        formatPdi(
          row.PDI
        ),

      color:
        pdi !== null
          ? pdiGradientColor(
              pdi,
              PDI_THRESHOLD
            )
          : 'var(--color-gray9)',

      lowerIsBetter:
        false,

      changeDigits:
        1,
    },
  ];

  const cards =
    cardConfigs.map(
      (config) => {
        const current =
          getRowMetric(
            row,
            config.dataKey
          );

        const previous =
          getRowMetric(
            previousRow,
            config.dataKey
          );

        const delta =
          current !== null &&
          previous !== null
            ? current -
              previous
            : null;

        let direction =
          null;

        if (
          delta !== null
        ) {
          if (
            delta === 0
          ) {
            direction =
              'flat';
          } else if (
            config
              .lowerIsBetter
          ) {
            direction =
              delta < 0
                ? 'up'
                : 'down';
          } else {
            direction =
              delta > 0
                ? 'up'
                : 'down';
          }
        }

        return {
          ...config,

          delta,

          direction,

          trendValues:
            trendRows.map(
              (
                trendRow
              ) =>
                getRowMetric(
                  trendRow,
                  config.dataKey
                )
            ),

          trendLabels:
            trendRows.map(
              (
                trendRow
              ) =>
                trendRow?.period ||
                ''
            ),
        };
      }
    );

  return (
    <div className="physician-trend-kpis">
      {cards.map(
        (card) => (
          <div
            key={card.key}
            className="glass u-container u-container--sm physician-trend-kpi"
            style={{
              '--physician-kpi-accent':
                card.color,
            }}
          >
            <div className="physician-trend-kpi__title">
              {card.title}
            </div>

            <div className="physician-trend-kpi__value-row">
              <div
                className="physician-trend-kpi__value"
                title={String(
                  card.value
                )}
              >
                {card.value}
              </div>

              <div
                className={`physician-trend-kpi__change ${
                  card.direction
                    ? `physician-trend-kpi__change--${card.direction}`
                    : 'physician-trend-kpi__change--unavailable'
                }`}
                title="تغییر نسبت به ماه قبل"
              >
                {card.direction ? (
                  <>
                    <ChangeChevron
                      direction={
                        card.direction
                      }
                    />

                    <span>
                      {formatChange(
                        card.delta,
                        card.changeDigits
                      )}
                    </span>
                  </>
                ) : (
                  <span>
                    —
                  </span>
                )}
              </div>
            </div>

            <div className="physician-trend-kpi__trend">
              <KpiMiniTrend
                values={
                  card.trendValues
                }
                labels={
                  card.trendLabels
                }
                lowerIsBetter={
                  card.lowerIsBetter
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PhysicianTrendKpiCards;