import React, {
  useId,
  useMemo,
} from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { buildBehavioralGroupsModel } from '../../utils/behavioralGroups';
import { Skeleton } from '../ui/Skeleton';
import ChartContainer from './ChartContainer';
import './BehavioralGroupsChart.css';

const EMPTY_STATE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '320px',
  color: 'var(--color-gray8)',
  fontFamily:
    'var(--font-family-base)',
};

const BehavioralGroupsChart = () => {
  const {
    data,
    loading,
  } = useDashboard();

  const rows =
    data.current || [];

  const rawId = useId();

  const clipPrefix =
    rawId.replace(
      /[^a-zA-Z0-9_-]/g,
      ''
    );

  const model =
    useMemo(
      () =>
        buildBehavioralGroupsModel(
          rows
        ),
      [rows]
    );

  const groupByFlag =
    Object.fromEntries(
      model.groups.map(
        (group) => [
          group.flag,
          group,
        ]
      )
    );

  const legendItems = [
    ...model.groups.map(
      (group) => ({
        label: group.label,
        color: group.color,
      })
    ),

    ...model.overlaps.map(
      (overlap) => ({
        label: overlap.label,
        color: overlap.color,
      })
    ),
  ];

  const title =
    'توزیع و تقاطع گروه‌های رفتاری';

  if (loading) {
    return (
      <ChartContainer
        title={title}
        className="behavioral-groups-chart"
        legendItems={legendItems}
      >
        <Skeleton
          width="100%"
          height="360px"
        />
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title={title}
      className="behavioral-groups-chart"
      legendItems={legendItems}
    >
      {model.isEmpty ? (
        <div style={EMPTY_STATE_STYLE}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      ) : (
        <div className="behavioral-groups-chart__wrapper">
          <svg
            viewBox={model.viewBox}
            className="behavioral-groups-chart__svg"
            role="img"
            aria-label="توزیع و تقاطع گروه‌های رفتاری پزشکان"
          >
            <defs>
              {model.overlaps.map(
                (overlap) => {
                  const first =
                    groupByFlag[
                      overlap
                        .firstFlag
                    ];

                  return (
                    <clipPath
                      key={
                        overlap.id
                      }
                      id={`behavioral-clip-${clipPrefix}-${overlap.id}`}
                    >
                      <circle
                        cx={first.cx}
                        cy={first.cy}
                        r={first.r}
                      />
                    </clipPath>
                  );
                }
              )}
            </defs>

            {model.groups.map(
              (group) => (
                <circle
                  key={`halo-${group.flag}`}
                  cx={group.cx}
                  cy={group.cy}
                  r={group.r + 7}
                  fill={group.color}
                  className="behavioral-groups-chart__halo"
                />
              )
            )}

            {model.groups.map(
              (group) => (
                <circle
                  key={`fill-${group.flag}`}
                  cx={group.cx}
                  cy={group.cy}
                  r={group.r}
                  fill={group.color}
                  className="behavioral-groups-chart__fill"
                />
              )
            )}

            {model.overlaps.map(
              (overlap) => {
                const second =
                  groupByFlag[
                    overlap.secondFlag
                  ];

                return (
                  <circle
                    key={`overlap-${overlap.id}`}
                    cx={second.cx}
                    cy={second.cy}
                    r={second.r}
                    fill={overlap.color}
                    clipPath={`url(#behavioral-clip-${clipPrefix}-${overlap.id})`}
                    className="behavioral-groups-chart__overlap"
                  />
                );
              }
            )}

            {model.groups.map(
              (group) => (
                <circle
                  key={`outline-${group.flag}`}
                  cx={group.cx}
                  cy={group.cy}
                  r={group.r}
                  fill="none"
                  stroke={group.color}
                  className="behavioral-groups-chart__outline"
                />
              )
            )}

            {model.groups.map(
              (group) => (
                <text
                  key={`count-${group.flag}`}
                  x={group.cx}
                  y={group.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="behavioral-groups-chart__count"
                  style={{
                    fontSize:
                      `${group.fontSize}px`,
                  }}
                >
                  {group.exclusive}
                </text>
              )
            )}

            {model.overlaps.map(
              (overlap) => (
                <text
                  key={`overlap-count-${overlap.id}`}
                  x={overlap.x}
                  y={overlap.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="behavioral-groups-chart__count behavioral-groups-chart__overlap-count"
                  style={{
                    fontSize:
                      `${overlap.fontSize}px`,
                  }}
                >
                  {overlap.count}
                </text>
              )
            )}
          </svg>
        </div>
      )}


    </ChartContainer>
  );
};

export default BehavioralGroupsChart;