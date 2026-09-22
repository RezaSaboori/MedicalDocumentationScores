import React from 'react';
import {
  useTooltip,
} from '@nivo/tooltip';
import ChartTooltip from './ChartTooltip';
import {
  formatPeriodLabel,
} from '../../utils/period';

const RESIDENTS_OPACITY =
  0.22;

const DIMMED_OPACITY =
  0.14;

const formatMetricValue = (
  value,
  digits
) => {
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
  seriesConfig,
  hoveredSeries,
}) => {
  const tooltip =
    useTooltip();

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

  const handleTooltip = (
    event,
    node
  ) => {
    const row =
      node.data?.row;

    if (!row) {
      return;
    }

    showTooltip(
      <ChartTooltip
        title={
          formatPeriodLabel(
            row.period
          )
        }
        rows={
          seriesConfig.map(
            (series) => ({
              label:
                series.label,

              value:
                formatMetricValue(
                  row[
                    series.dataKey
                  ],
                  series.digits
                ),
            })
          )
        }
      />,
      event
    );
  };

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

          const residentsNodes =
            nodes.filter(
              (node) =>
                node.serieId ===
                series.residentsId
            );

          const metricOpacity =
            hoveredSeries &&
            hoveredSeries !==
              series.id
              ? DIMMED_OPACITY
              : 1;

          return (
            <g
              key={series.id}
              opacity={
                metricOpacity
              }
              className="physician-score-trend__series"
            >
              {buildSegments(
                residentsNodes
              ).map(
                (
                  segment,
                  segmentIndex
                ) => (
                  <polyline
                    key={`${series.residentsId}-${segmentIndex}`}
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
                      RESIDENTS_OPACITY
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

              {physicianNodes.map(
                (node) => (
                  <circle
                    key={node.id}
                    cx={node.x}
                    cy={node.y}
                    r="4"
                    fill={
                      series.color
                    }
                    stroke="var(--color-gray1)"
                    strokeWidth="1.5"
                    className="physician-score-trend__point"
                    onMouseEnter={(
                      event
                    ) =>
                      handleTooltip(
                        event,
                        node
                      )
                    }
                    onMouseMove={(
                      event
                    ) =>
                      handleTooltip(
                        event,
                        node
                      )
                    }
                    onMouseLeave={
                      hideTooltip
                    }
                  />
                )
              )}
            </g>
          );
        }
      )}
    </g>
  );
};

export default PhysicianScoreTrendLayer;