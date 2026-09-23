import React, {
  useMemo,
} from 'react';

const WIDTH = 132;
const HEIGHT = 38;

const PADDING_X = 5;
const PADDING_Y = 5;

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

const buildSegments = (
  points
) => {
  const segments = [];

  let current = [];

  points.forEach(
    (point) => {
      if (!point) {
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
  lowerIsBetter = false,
}) => {
  const {
    points,
    segments,
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

    if (
      !finiteValues.length
    ) {
      return {
        points: [],
        segments: [],
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

    const drawableWidth =
      WIDTH -
      2 * PADDING_X;

    const drawableHeight =
      HEIGHT -
      2 * PADDING_Y;

    const denominator =
      Math.max(
        values.length - 1,
        1
      );

    const pointList =
      normalizedValues.map(
        (
          value,
          index
        ) => {
          if (
            value === null
          ) {
            return null;
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
            x:
              PADDING_X +
              (
                index /
                denominator
              ) *
                drawableWidth,

            y:
              PADDING_Y +
              visualNormalized *
                drawableHeight,

            value,
            index,
          };
        }
      );

    return {
      points:
        pointList,

      segments:
        buildSegments(
          pointList
        ),
    };
  }, [
    values,
    lowerIsBetter,
  ]);

  return (
    <svg
      className="physician-trend-kpi__sparkline"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        className="physician-trend-kpi__sparkline-baseline"
        x1={PADDING_X}
        y1={
          HEIGHT -
          PADDING_Y
        }
        x2={
          WIDTH -
          PADDING_X
        }
        y2={
          HEIGHT -
          PADDING_Y
        }
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

      {points.map(
        (
          point,
          index
        ) =>
          point ? (
            <circle
              key={
                index
              }
              className={`physician-trend-kpi__sparkline-point ${
                index ===
                points.length -
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
                points.length -
                  1
                  ? 2.8
                  : 2
              }
            />
          ) : null
      )}
    </svg>
  );
};

export default KpiMiniTrend;