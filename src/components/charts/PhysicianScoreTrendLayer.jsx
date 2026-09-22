import React, {
  useMemo,
  useState,
} from 'react';
import {
  useTooltip,
} from '@nivo/tooltip';
import {
  formatPeriodLabel,
  toPersianDigits,
} from '../../utils/period';
import PhysicianTrendTooltip from './PhysicianTrendTooltip';

const BENCHMARK_OPACITY =
  0.22;

const LEGEND_DIMMED_OPACITY =
  0.14;

const ACTIVE_LINE_OPACITY =
  0.16;

const INACTIVE_POINT_OPACITY =
  0.1;

const formatMetricValue = (
  value,
  digits
) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number.toFixed(digits)
    : '—';
};

const buildSegments = (
  nodes
) => {
  const sortedNodes =
    [...nodes].sort(
      (a, b) =>
        Number(a.data?.x) -
        Number(b.data?.x)
    );

  const segments = [];
  let currentSegment = [];

  sortedNodes.forEach(
    (node) => {
      const currentIndex =
        Number(
          node.data?.x
        );

      const previousNode =
        currentSegment[
          currentSegment.length - 1
        ];

      const previousIndex =
        Number(
          previousNode?.data?.x
        );

      if (
        previousNode &&
        currentIndex -
          previousIndex >
          1
      ) {
        segments.push(
          currentSegment
        );

        currentSegment = [];
      }

      currentSegment.push(
        node
      );
    }
  );

  if (
    currentSegment.length
  ) {
    segments.push(
      currentSegment
    );
  }

  return segments;
};

const PhysicianScoreTrendLayer = ({
  nodes,
  data,
  xScale,
  innerWidth,
  innerHeight,
  seriesConfig,
  hoveredSeries,
}) => {
  const tooltip =
    useTooltip();

  const [
    activeMonthIndex,
    setActiveMonthIndex,
  ] = useState(null);

  const monthTerritories =
    useMemo(() => {
      if (!data.length) {
        return [];
      }

      const centers =
        data.map(
          (_, index) =>
            xScale(index)
        );

      return data.map(
        (
          row,
          index
        ) => {
          const center =
            centers[index];

          const left =
            index === 0
              ? 0
              : (
                  centers[
                    index - 1
                  ] +
                  center
                ) /
                2;

          const right =
            index ===
            data.length - 1
              ? innerWidth
              : (
                  center +
                  centers[
                    index + 1
                  ]
                ) /
                2;

          return {
            index,
            row,
            x: left,
            width:
              Math.max(
                0,
                right - left
              ),
          };
        }
      );
    }, [
      data,
      xScale,
      innerWidth,
    ]);

  const showTooltip = (
    content,
    event
  ) => {
    if (
      typeof tooltip
        .showTooltipFromEvent ===
      'function'
    ) {
      tooltip.showTooltipFromEvent(
        content,
        event
      );

      return;
    }

    if (
      typeof tooltip
        .showTooltip ===
      'function'
    ) {
      tooltip.showTooltip(
        content,
        event
      );
    }
  };

  const hideTooltip = () => {
    if (
      typeof tooltip
        .hideTooltip ===
      'function'
    ) {
      tooltip.hideTooltip();
    }
  };

  const showMonthTooltip = (
    event,
    monthIndex
  ) => {
    const row =
      data[monthIndex];

    if (!row) {
      return;
    }

    setActiveMonthIndex(
      monthIndex
    );

    const isResident =
      row.category ===
      'resident';

    const hasKnownYear =
      row.resident_year !==
        null &&
      row.resident_year !==
        undefined &&
      String(
        row.resident_year
      ).trim() !== '';

    const relatedYearLabel =
      hasKnownYear
        ? `دستیاران سال ${toPersianDigits(
            row.resident_year
          )}`
        : 'دستیاران همه سال‌ها';

    const columns =
      isResident
        ? [
            'شاخص',
            'پزشک',
            relatedYearLabel,
            'همه دستیاران',
          ]
        : [
            'شاخص',
            'پزشک',
            'همه دستیاران',
          ];

    const tooltipRows =
      seriesConfig.map(
        (series) => ({
          label:
            series.label,

          color:
            series.color,

          values:
            isResident
              ? [
                  formatMetricValue(
                    row[
                      series.dataKey
                    ],
                    series.digits
                  ),

                  formatMetricValue(
                    row[
                      series
                        .yearResidentsDataKey
                    ],
                    series.digits
                  ),

                  formatMetricValue(
                    row[
                      series
                        .allResidentsDataKey
                    ],
                    series.digits
                  ),
                ]
              : [
                  formatMetricValue(
                    row[
                      series.dataKey
                    ],
                    series.digits
                  ),

                  formatMetricValue(
                    row[
                      series
                        .allResidentsDataKey
                    ],
                    series.digits
                  ),
                ],
        })
      );

    showTooltip(
      <PhysicianTrendTooltip
        title={
          formatPeriodLabel(
            row.period
          )
        }
        columns={
          columns
        }
        rows={
          tooltipRows
        }
        qualityRow={
          row.row_id !== null
            ? row
            : null
        }
      />,
      event
    );
  };

  const clearActiveMonth = () => {
    setActiveMonthIndex(
      null
    );

    hideTooltip();
  };

  const hasActiveMonth =
    activeMonthIndex !== null;

  return (
    <g>
      {seriesConfig.map(
        (series) => {
          const physicianNodes =
            nodes.filter(
              (node) =>
                node.serieId ===
                series.id
            );

          const benchmarkNodes =
            nodes.filter(
              (node) =>
                node.serieId ===
                series.benchmarkId
            );

          const legendOpacity =
            hoveredSeries &&
            hoveredSeries !==
              series.id
              ? LEGEND_DIMMED_OPACITY
              : 1;

          const lineOpacity =
            hasActiveMonth
              ? ACTIVE_LINE_OPACITY *
                legendOpacity
              : legendOpacity;

          return (
            <g
              key={series.id}
              className="physician-score-trend__series"
            >
              <g
                opacity={
                  lineOpacity
                }
              >
                {buildSegments(
                  benchmarkNodes
                ).map(
                  (
                    segment,
                    segmentIndex
                  ) => (
                    <polyline
                      key={`${series.benchmarkId}-${segmentIndex}`}
                      points={
                        segment
                          .map(
                            (node) =>
                              `${node.x},${node.y}`
                          )
                          .join(' ')
                      }
                      fill="none"
                      stroke={
                        series.color
                      }
                      strokeWidth="2.25"
                      strokeOpacity={
                        BENCHMARK_OPACITY
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pointerEvents="none"
                    />
                  )
                )}

                {buildSegments(
                  physicianNodes
                ).map(
                  (
                    segment,
                    segmentIndex
                  ) => (
                    <polyline
                      key={`${series.id}-${segmentIndex}`}
                      points={
                        segment
                          .map(
                            (node) =>
                              `${node.x},${node.y}`
                          )
                          .join(' ')
                      }
                      fill="none"
                      stroke={
                        series.color
                      }
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pointerEvents="none"
                    />
                  )
                )}
              </g>

              {physicianNodes.map(
                (node) => {
                  const nodeMonthIndex =
                    Number(
                      node.data?.x
                    );

                  const isActivePoint =
                    activeMonthIndex ===
                    nodeMonthIndex;

                  const pointOpacity =
                    hasActiveMonth
                      ? isActivePoint
                        ? legendOpacity
                        : INACTIVE_POINT_OPACITY *
                          legendOpacity
                      : legendOpacity;

                  return (
                    <circle
                      key={node.id}
                      cx={node.x}
                      cy={node.y}
                      r={
                        isActivePoint
                          ? 5
                          : 4
                      }
                      fill={
                        series.color
                      }
                      fillOpacity={
                        pointOpacity
                      }
                      stroke="var(--color-gray1)"
                      strokeOpacity={
                        pointOpacity
                      }
                      strokeWidth="1.5"
                      pointerEvents="none"
                      className="physician-score-trend__point"
                    />
                  );
                }
              )}
            </g>
          );
        }
      )}

      <g
        className="physician-score-trend__territories"
        onMouseLeave={
          clearActiveMonth
        }
      >
        {monthTerritories.map(
          ({
            index,
            x,
            width,
          }) => (
            <rect
              key={index}
              x={x}
              y={0}
              width={width}
              height={
                innerHeight
              }
              fill="transparent"
              pointerEvents="all"
              className="physician-score-trend__month-territory"
              onMouseEnter={(
                event
              ) =>
                showMonthTooltip(
                  event,
                  index
                )
              }
              onMouseMove={(
                event
              ) =>
                showMonthTooltip(
                  event,
                  index
                )
              }
            />
          )
        )}
      </g>
    </g>
  );
};

export default PhysicianScoreTrendLayer;