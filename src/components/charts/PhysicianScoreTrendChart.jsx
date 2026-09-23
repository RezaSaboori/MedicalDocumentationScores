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
import PhysicianTrendYAxis from './PhysicianTrendYAxis';

const SERIES_CONFIG = [
  {
    id: 'pdi',
    benchmarkId:
      'pdi-benchmark',
    dataKey: 'PDI',
    benchmarkDataKey:
      'benchmark_PDI',
    yearResidentsDataKey:
      'year_residents_PDI',
    allResidentsDataKey:
      'residents_PDI',
    label:
      'امتیاز کیفیت ثبت پرونده‌ها',
    color:
      'var(--color-purple)',
    digits: 1,
  },
  {
    id: 'calibrated',
    benchmarkId:
      'calibrated-benchmark',
    dataKey:
      'calibrated_score',
    benchmarkDataKey:
      'benchmark_calibrated_score',
    yearResidentsDataKey:
      'year_residents_calibrated_score',
    allResidentsDataKey:
      'residents_calibrated_score',
    label:
      'میانگین نمرات پرونده‌ها - کالیبره‌شده',
    color:
      'var(--color-blue)',
    digits: 2,
  },
  {
    id: 'raw',
    benchmarkId:
      'raw-benchmark',
    dataKey:
      'raw_score',
    benchmarkDataKey:
      'benchmark_raw_score',
    yearResidentsDataKey:
      'year_residents_raw_score',
    allResidentsDataKey:
      'residents_raw_score',
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

  const isResidentTrend =
    data.some(
      (row) =>
        row.category ===
        'resident'
    );

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
        SERIES_CONFIG.flatMap(
          (config) => {
            const physicianSeries = {
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
            };

            const benchmarkSeries = {
              id:
                config.benchmarkId,

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
                            .benchmarkDataKey
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
            };

            return [
              physicianSeries,
              benchmarkSeries,
            ];
          }
        ),
      [data]
    );

  const hasValues =
    SERIES_CONFIG.some(
      (config) =>
        data.some((row) =>
          Number.isFinite(
            Number(
              row[
                config.dataKey
              ]
            )
          )
        )
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
  const xScaleConfig = {
    type: 'linear',
    min: 0,
    max: Math.max(
      data.length - 1,
      1
    ),
  };

  const yScaleConfig = {
    type: 'linear',
    min: 'auto',
    max: 'auto',
  };

  const yAxisConfig = {
    legend: 'امتیاز',
    legendPosition:
      'middle',
    legendOffset: -56,
  };

  return (
    <section className="glass u-container u-container--md physician-trend-chart">
      <header className="physician-trend-chart__header">
        <div>
          <h3 className="physician-trend-chart__title">
            روند امتیازها
          </h3>

          <p className="physician-trend-chart__subtitle">
            {isResidentTrend
              ? 'خطوط کم‌رنگ = میانگین دستیاران هم‌سال؛ سال نامشخص = همه دستیاران'
              : 'خطوط کم‌رنگ = روند همه دستیاران'}
          </p>
        </div>
      </header>

      {!hasValues ? (
        <div className="physician-trend-chart__empty">
          داده‌ای برای نمایش وجود ندارد
        </div>
      ) : (
        <>
          <div className="physician-trend-chart__viewport">
            <PhysicianTrendYAxis
              data={series}
              xScale={
                xScaleConfig
              }
              yScale={
                yScaleConfig
              }
              axisLeft={
                yAxisConfig
              }
            />

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
                    left: 12,
                  }}
                  xScale={
                    xScaleConfig
                  }
                  yScale={
                    yScaleConfig
                  }
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
                    legend:
                      'زمان',
                    legendPosition:
                      'middle',
                    legendOffset:
                      58,
                  }}
                  axisLeft={
                    null
                  }
                  enableGridX={
                    false
                  }
                  enableGridY
                  isInteractive
                  layers={[
                    'grid',
                    'axes',
                    (
                      layerProps
                    ) => (
                      <PhysicianScoreTrendLayer
                        key="score-trend"
                        {...layerProps}
                        data={
                          data
                        }
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