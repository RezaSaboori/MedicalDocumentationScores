import React, {
  useMemo,
  useState,
} from 'react';
import {
  ResponsiveScatterPlot,
} from '@nivo/scatterplot';
import {
  formatPeriodLabel,
} from '../../utils/period';
import PhysicianScoreTrendLayer from './PhysicianScoreTrendLayer';

const SERIES_CONFIG = [
  {
    id: 'pdi',
    dataKey: 'PDI',
    label:
      'امتیاز کیفیت ثبت پرونده‌ها',
    color:
      'var(--color-purple)',
    digits: 1,
  },
  {
    id: 'calibrated',
    dataKey:
      'calibrated_score',
    label:
      'میانگین نمرات پرونده‌ها - کالیبره‌شده',
    color:
      'var(--color-blue)',
    digits: 2,
  },
  {
    id: 'raw',
    dataKey:
      'raw_score',
    label:
      'میانگین نمرات پرونده‌ها - خام',
    color:
      'var(--color-orange)',
    digits: 2,
  },
];

const PhysicianScoreTrendChart = ({
  data,
}) => {
  const [
    hoveredSeries,
    setHoveredSeries,
  ] = useState(null);

  const periodLabels =
    useMemo(
      () =>
        data.map(
          (row) =>
            formatPeriodLabel(
              row.period
            )
        ),
      [data]
    );

  const series =
    useMemo(
      () =>
        SERIES_CONFIG.map(
          (config) => ({
            id: config.id,

            data: data
              .map(
                (
                  row,
                  index
                ) => {
                  const value =
                    Number(
                      row[
                        config
                          .dataKey
                      ]
                    );

                  if (
                    !Number.isFinite(
                      value
                    )
                  ) {
                    return null;
                  }

                  return {
                    x: index,
                    y: value,
                    row,
                  };
                }
              )
              .filter(Boolean),
          })
        ),
      [data]
    );

  const hasValues =
    series.some(
      (item) =>
        item.data.length > 0
    );

  const tickValues =
    useMemo(
      () =>
        data.map(
          (_, index) =>
            index
        ),
      [data]
    );

  const chartMinWidth =
    Math.max(
      720,
      data.length * 120
    );

  return (
    <section className="glass u-container u-container--md physician-trend-chart">
      <header className="physician-trend-chart__header">
        <h3 className="physician-trend-chart__title">
          روند امتیازها
        </h3>
      </header>

      {!hasValues ? (
        <div className="physician-trend-chart__empty">
          داده‌ای برای نمایش وجود ندارد
        </div>
      ) : (
        <>
          <div className="physician-trend-chart__scroll">
            <div
              className="physician-trend-chart__plot"
              style={{
                minWidth:
                  `${chartMinWidth}px`,
              }}
            >
              <ResponsiveScatterPlot
                data={series}
                margin={{
                  top: 24,
                  right: 32,
                  bottom: 76,
                  left: 72,
                }}
                xScale={{
                  type: 'linear',
                  min: 0,
                  max: Math.max(
                    data.length - 1,
                    1
                  ),
                }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                }}
                axisBottom={{
                  tickValues,
                  format: (
                    value
                  ) =>
                    periodLabels[
                      Math.round(
                        value
                      )
                    ] || '',
                  legend: 'زمان',
                  legendPosition:
                    'middle',
                  legendOffset: 58,
                }}
                axisLeft={{
                  legend: 'امتیاز',
                  legendPosition:
                    'middle',
                  legendOffset: -56,
                }}
                enableGridX={false}
                enableGridY
                isInteractive={false}
                layers={[
                  'grid',
                  'axes',
                  (
                    layerProps
                  ) => (
                    <PhysicianScoreTrendLayer
                      key="score-trend"
                      {...layerProps}
                      seriesConfig={
                        SERIES_CONFIG
                      }
                      hoveredSeries={
                        hoveredSeries
                      }
                    />
                  ),
                ]}
              />
            </div>
          </div>

          <div className="physician-score-trend__legend">
            {SERIES_CONFIG.map(
              (seriesItem) => {
                const isDimmed =
                  hoveredSeries &&
                  hoveredSeries !==
                    seriesItem.id;

                return (
                  <button
                    key={
                      seriesItem.id
                    }
                    type="button"
                    className={`physician-score-trend__legend-item ${
                      isDimmed
                        ? 'physician-score-trend__legend-item--dimmed'
                        : ''
                    }`}
                    onMouseEnter={() =>
                      setHoveredSeries(
                        seriesItem.id
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredSeries(
                        null
                      )
                    }
                  >
                    <span
                      className="physician-score-trend__legend-dot"
                      style={{
                        '--physician-trend-series-color':
                          seriesItem.color,
                      }}
                    />

                    <span>
                      {
                        seriesItem.label
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default PhysicianScoreTrendChart;