import React, {
  useMemo,
} from 'react';
import {
  formatPeriodLabel,
} from '../../utils/period';

const WIDTH = 180;
const HEIGHT = 92;

const PADDING_LEFT = 10;
const PADDING_RIGHT = 10;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 22;

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

const formatPointValue = (
  value
) => {
  const number =
    toFiniteNumber(
      value
    );

  if (number === null) {
    return '—';
  }

  return Number.isInteger(
    number
  )
    ? String(number)
    : number.toFixed(1);
};

const buildSegments = (
  points
) => {
  const segments = [];

  let current = [];

  points.forEach(
    (point) => {
      if (
        !point?.hasValue
      ) {
        if (
          current.length
        ) {
          segments.push(
            current
          );

          current = [];
        }

        return;
      }

      current.push(point);
    }
  );

  if (
    current.length
  ) {
    segments.push(
      current
    );
  }

  return segments;
};

const KpiMiniTrend = ({
  values = [],
  labels = [],
  lowerIsBetter = false,
}) => {
  const {
    slots,
    segments,
    axisY,
  } = useMemo(() => {
    const normalizedValues =
      values.map(
        toFiniteNumber
      );

    const finiteValues =
      normalizedValues.filter(
        (value) =>
          value !== null
      );

    const drawableWidth =
      WIDTH -
      PADDING_LEFT -
      PADDING_RIGHT;

    const drawableHeight =
      HEIGHT -
      PADDING_TOP -
      PADDING_BOTTOM;

    const denominator =
      Math.max(
        normalizedValues.length - 1,
        1
      );

    const axisYValue =
      HEIGHT -
      PADDING_BOTTOM;

    if (
      !finiteValues.length
    ) {
      const emptySlots =
        normalizedValues.map(
          (
            value,
            index
          ) => ({
            x:
              PADDING_LEFT +
              (
                index /
                denominator
              ) *
                drawableWidth,

            y:
              axisYValue -
              drawableHeight /
                2,

            value,
            label:
              labels[index]
                ? formatPeriodLabel(
                    labels[index]
                  )
                : '',

            hasValue: false,
          })
        );

      return {
        slots:
          emptySlots,
        segments: [],
        axisY:
          axisYValue,
      };
    }

    let minimum =
      Math.min(
        ...finiteValues
      );

    let maximum =
      Math.max(
        ...finiteValues
      );

    if (
      minimum === maximum
    ) {
      minimum -= 1;
      maximum += 1;
    }

    const pointSlots =
      normalizedValues.map(
        (
          value,
          index
        ) => {
          const x =
            PADDING_LEFT +
            (
              index /
              denominator
            ) *
              drawableWidth;

          const label =
            labels[index]
              ? formatPeriodLabel(
                  labels[index]
                )
              : '';

          if (
            value === null
          ) {
            return {
              x,
              y:
                axisYValue -
                drawableHeight /
                  2,
              value,
              label,
              hasValue: false,
            };
          }

          const normalized =
            (
              value -
              minimum
            ) /
            (
              maximum -
              minimum
            );

          const visualNormalized =
            lowerIsBetter
              ? normalized
              : 1 -
                normalized;

          return {
            x,

            y:
              PADDING_TOP +
              visualNormalized *
                drawableHeight,

            value,
            label,
            hasValue: true,
          };
        }
      );

    return {
      slots:
        pointSlots,

      segments:
        buildSegments(
          pointSlots
        ),

      axisY:
        axisYValue,
    };
  }, [
    values,
    labels,
    lowerIsBetter,
  ]);

  return (
    <svg
      className="physician-trend-kpi__sparkline"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <line
        className="physician-trend-kpi__sparkline-axis"
        x1={PADDING_LEFT}
        y1={axisY}
        x2={
          WIDTH -
          PADDING_RIGHT
        }
        y2={axisY}
      />

      {segments.map(
        (
          segment,
          index
        ) =>
          segment.length >
          1 ? (
            <polyline
              key={
                index
              }
              className="physician-trend-kpi__sparkline-line"
              points={
                segment
                  .map(
                    (
                      point
                    ) =>
                      `${point.x},${point.y}`
                  )
                  .join(
                    ' '
                  )
              }
            />
          ) : null
      )}

      {slots.map(
        (
          point,
          index
        ) => (
          <g
            key={index}
          >
            {point.hasValue && (
              <text
                className="physician-trend-kpi__sparkline-value-label"
                x={
                  point.x
                }
                y={Math.max(
                  point.y -
                    8,
                  11
                )}
              >
                {formatPointValue(
                  point.value
                )}
              </text>
            )}

            {point.hasValue && (
              <circle
                className={`physician-trend-kpi__sparkline-point ${
                  index ===
                  slots.length -
                    1
                    ? 'physician-trend-kpi__sparkline-point--current'
                    : ''
                }`}
                cx={
                  point.x
                }
                cy={
                  point.y
                }
                r={
                  index ===
                  slots.length -
                    1
                    ? 3.6
                    : 3
                }
              />
            )}

            <text
              className="physician-trend-kpi__sparkline-month-label"
              x={
                point.x
              }
              y={
                HEIGHT - 4
              }
            >
              {point.label}
            </text>
          </g>
        )
      )}
    </svg>
  );
};

export default KpiMiniTrend;