import React, {
  useMemo,
} from 'react';
import {
  useDashboard,
} from '../../context/DashboardContext';
import {
  formatNumber,
  formatPercent,
  pdiGradientColor,
} from '../../utils/formatters';
import {
  DASHBOARD_MODES,
  PDI_THRESHOLD,
} from '../../utils/constants';
import {
  Skeleton,
} from '../ui/Skeleton';
import KpiMiniTrend from './KpiMiniTrend';
import './PhysicianTrendKpiCards.css';
import './KpiCards.css';

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

const buildKpis = (
  rows
) => {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }

  const validPdi =
    rows
      .map((row) =>
        toFiniteNumber(
          row.PDI
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  const validCov =
    rows
      .map((row) =>
        toFiniteNumber(
          row.COV
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  const validEmptyRate =
    rows
      .map((row) =>
        toFiniteNumber(
          row.rho_Z
        )
      )
      .filter(
        (value) =>
          value !== null
      );

  return {
    n_physicians:
      rows.length,

    total_visits:
      rows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          (
            toFiniteNumber(
              row.V
            ) || 0
          ),
        0
      ),

    mean_pdi:
      validPdi.length
        ? validPdi.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          ) /
          validPdi.length
        : null,

    mean_cov:
      validCov.length
        ? validCov.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          ) /
          validCov.length
        : null,

    mean_rho_z:
      validEmptyRate.length
        ? validEmptyRate.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          ) /
          validEmptyRate.length
        : null,
  };
};

const formatChange = (
  value,
  {
    digits = 0,
    scale = 1,
    suffix = '',
  } = {}
) => {
  if (
    value === null
  ) {
    return '—';
  }

  const absolute =
    Math.abs(
      value *
        scale
    );

  const formatted =
    digits > 0
      ? absolute.toFixed(
          digits
        )
      : formatNumber(
          absolute,
          0
        );

  return `${formatted}${suffix}`;
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

const getDirection = (
  delta,
  lowerIsBetter
) => {
  if (
    delta === null
  ) {
    return null;
  }

  if (
    delta === 0
  ) {
    return 'flat';
  }

  if (
    lowerIsBetter
  ) {
    return delta < 0
      ? 'up'
      : 'down';
  }

  return delta > 0
    ? 'up'
    : 'down';
};

const KpiCards = () => {
  const {
    data,
    loading,
    mode,
  } = useDashboard();

  const currentKpis =
    useMemo(
      () =>
        buildKpis(
          data.current
        ),
      [data.current]
    );

  const previousKpis =
    useMemo(
      () =>
        buildKpis(
          data.previous
        ),
      [data.previous]
    );

  const olderKpis =
    useMemo(
      () =>
        buildKpis(
          data.older
        ),
      [data.older]
    );

  if (loading) {
    return (
      <div className="kpi-grid">
        {Array.from({
          length: 5,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={index}
              className="glass u-container u-container--sm physician-trend-kpi kpi-card--loading"
            >
              <Skeleton
                width="55%"
                height="1rem"
              />

              <Skeleton
                width="45%"
                height="3rem"
              />

              <Skeleton
                width="90%"
                height="5rem"
              />
            </div>
          )
        )}
      </div>
    );
  }

  if (
    !currentKpis
  ) {
    return (
      <div
        className="glass u-container u-container--md"
        style={{
          padding:
            'var(--spacing-lg)',

          textAlign:
            'center',

          color:
            'var(--color-gray9)',

          fontFamily:
            'var(--font-family-base)',
        }}
      >
        داده‌ای مطابق فیلترهای انتخابی یافت نشد
      </div>
    );
  }

  const firstKpiTitle =
    mode ===
    DASHBOARD_MODES.FACULTY
      ? 'تعداد اساتید'
      : 'تعداد رزیدنت‌ها';

  const history = [
    olderKpis,
    previousKpis,
    currentKpis,
  ];

  const trendLabels = [
    data.periods?.older ||
      '',

    data.periods?.previous ||
      '',

    data.periods?.current ||
      '',
  ];

  const meanPdi =
    toFiniteNumber(
      currentKpis.mean_pdi
    );

  const cardConfigs = [
    {
      key:
        'n_physicians',

      title:
        firstKpiTitle,

      value:
        formatNumber(
          currentKpis
            .n_physicians
        ),

      color:
        'var(--color-blue)',

      lowerIsBetter:
        false,

      changeDigits:
        0,

      changeScale:
        1,

      changeSuffix:
        '',

      valueFormatter:
        (value) =>
          formatNumber(
            value,
            0
          ),
    },

    {
      key:
        'total_visits',

      title:
        'مجموع ویزیت‌ها',

      value:
        formatNumber(
          currentKpis
            .total_visits
        ),

      color:
        'var(--color-blue)',

      lowerIsBetter:
        false,

      changeDigits:
        0,

      changeScale:
        1,

      changeSuffix:
        '',

      valueFormatter:
        (value) =>
          formatNumber(
            value,
            0
          ),
    },

    {
      key:
        'mean_pdi',

      title:
        'میانگین PDI',

      value:
        meanPdi !== null
          ? meanPdi.toFixed(
              1
            )
          : '—',

      color:
        meanPdi !== null
          ? pdiGradientColor(
              meanPdi,
              PDI_THRESHOLD
            )
          : 'var(--color-gray9)',

      lowerIsBetter:
        false,

      changeDigits:
        1,

      changeScale:
        1,

      changeSuffix:
        '',

      valueFormatter:
        (value) =>
          Number(
            value
          ).toFixed(1),
    },

    {
      key:
        'mean_cov',

      title:
        'نسبت مستندسازی',

      value:
        currentKpis
          .mean_cov !==
        null
          ? formatPercent(
              currentKpis
                .mean_cov,
              0
            )
          : '—',

      color:
        'var(--color-green)',

      lowerIsBetter:
        false,

      changeDigits:
        0,

      changeScale:
        100,

      changeSuffix:
        '٪',

      valueFormatter:
        (value) =>
          formatPercent(
            value,
            0
          ),
    },

    {
      key:
        'mean_rho_z',

      title:
        'میانگین نرخ پرونده خالی',

      value:
        currentKpis
          .mean_rho_z !==
        null
          ? formatPercent(
              currentKpis
                .mean_rho_z,
              0
            )
          : '—',

      color:
        'var(--color-orange)',

      lowerIsBetter:
        true,

      changeDigits:
        0,

      changeScale:
        100,

      changeSuffix:
        '٪',

      valueFormatter:
        (value) =>
          formatPercent(
            value,
            0
          ),
    },
  ];

  const cards =
    cardConfigs.map(
      (config) => {
        const current =
          toFiniteNumber(
            currentKpis[
              config.key
            ]
          );

        const previous =
          toFiniteNumber(
            previousKpis?.[
              config.key
            ]
          );

        const delta =
          current !== null &&
          previous !== null
            ? current -
              previous
            : null;

        return {
          ...config,

          delta,

          direction:
            getDirection(
              delta,
              config
                .lowerIsBetter
            ),

          trendValues:
            history.map(
              (
                periodKpis
              ) =>
                toFiniteNumber(
                  periodKpis?.[
                    config.key
                  ]
                )
            ),
        };
      }
    );

  return (
    <div className="kpi-grid">
      {cards.map(
        (card) => (
          <div
            key={
              card.key
            }
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
                        {
                          digits:
                            card.changeDigits,

                          scale:
                            card.changeScale,

                          suffix:
                            card.changeSuffix,
                        }
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
                  trendLabels
                }
                lowerIsBetter={
                  card.lowerIsBetter
                }
                valueFormatter={
                  card.valueFormatter
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default KpiCards;