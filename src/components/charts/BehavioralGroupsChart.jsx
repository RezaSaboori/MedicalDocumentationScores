import React, {
  useId,
  useMemo,
  useState,
} from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { buildBehavioralGroupsModel } from '../../utils/behavioralGroups';
import { Skeleton } from '../ui/Skeleton';
import ChartContainer from './ChartContainer';
import ChartTooltip from './ChartTooltip';
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

  const [hovered, setHovered] =
    useState(null);

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

  const legendItems =
    model.groups.map(
      (group) => ({
        label: `${group.label} (${group.total})`,
        color: group.color,
      })
    );

  const hoveredGroup =
    model.groups.find(
      (group) =>
        hovered ===
        `group:${group.flag}`
    );

  const hoveredOverlap =
    model.overlaps.find(
      (overlap) =>
        hovered ===
        `overlap:${overlap.id}`
    );

  const title =
    'توزیع و تقاطع گروه‌های رفتاری';

  const subtitle =
    'اندازه دایره‌ها بر اساس تعداد کل پزشکان هر گروه است؛ اعداد داخل نواحی بدون شمارش مضاعف نمایش داده می‌شوند';

  if (loading) {
    return (
      <ChartContainer
        title={title}
        subtitle={subtitle}
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
      subtitle={subtitle}
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
              (group) => {
                const groupKey =
                  `group:${group.flag}`;

                const activeFromOverlap =
                  hoveredOverlap &&
                  (
                    hoveredOverlap.firstFlag ===
                      group.flag ||
                    hoveredOverlap.secondFlag ===
                      group.flag
                  );

                const isActive =
                  hovered ===
                    groupKey ||
                  activeFromOverlap;

                return (
                  <circle
                    key={`fill-${group.flag}`}
                    cx={group.cx}
                    cy={group.cy}
                    r={group.r}
                    fill={group.color}
                    className={`behavioral-groups-chart__fill${
                      isActive
                        ? ' is-active'
                        : ''
                    }`}
                    onMouseEnter={() =>
                      setHovered(
                        groupKey
                      )
                    }
                    onMouseLeave={() =>
                      setHovered(
                        null
                      )
                    }
                  />
                );
              }
            )}

            {model.overlaps.map(
              (overlap) => {
                const second =
                  groupByFlag[
                    overlap
                      .secondFlag
                  ];

                const overlapKey =
                  `overlap:${overlap.id}`;

                return (
                  <circle
                    key={`overlap-${overlap.id}`}
                    cx={second.cx}
                    cy={second.cy}
                    r={second.r}
                    fill={overlap.color}
                    clipPath={`url(#behavioral-clip-${clipPrefix}-${overlap.id})`}
                    className={`behavioral-groups-chart__overlap${
                      hovered ===
                      overlapKey
                        ? ' is-active'
                        : ''
                    }`}
                    onMouseEnter={() =>
                      setHovered(
                        overlapKey
                      )
                    }
                    onMouseLeave={() =>
                      setHovered(
                        null
                      )
                    }
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
                  x={group.labelX}
                  y={group.labelY}
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

      {hoveredGroup && (
        <ChartTooltip
          title={hoveredGroup.label}
          rows={[
            {
              label:
                'کل اعضای گروه',
              value:
                hoveredGroup.total,
            },
            {
              label:
                'بدون هم‌پوشانی',
              value:
                hoveredGroup.exclusive,
            },
          ]}
        />
      )}

      {hoveredOverlap && (
        <ChartTooltip
          title={
            hoveredOverlap.label
          }
          rows={[
            {
              label:
                'تعداد پزشکان',
              value:
                hoveredOverlap.count,
            },
          ]}
        />
      )}
    </ChartContainer>
  );
};

export default BehavioralGroupsChart;