import React, {
  useMemo,
} from 'react';
import {
  ResponsiveScatterPlot,
} from '@nivo/scatterplot';
import {
  formatPeriodLabel,
} from '../../utils/period';
import ChartLegend from './ChartLegend';
import PhysicianDocumentationBubbleLayer from './PhysicianDocumentationBubbleLayer';

const PhysicianDocumentationBubbleChart = ({
  data,
}) => {
  const validRows =
    useMemo(
      () =>
        data.filter(
          (row) =>
            Number.isFinite(
              Number(
                row
                  .documentation_ratio
              )
            ) &&
            row.row_id !==
              null
        ),
      [data]
    );

  const groupColors =
    useMemo(() => {
      const map =
        new Map();

      validRows.forEach(
        (row) => {
          if (
            !map.has(
              row.group_fa
            )
          ) {
            map.set(
              row.group_fa,
              row.group_color
            );
          }
        }
      );

      return map;
    }, [validRows]);

  const series =
    useMemo(() => {
      const byGroup =
        new Map();

      data.forEach(
        (
          row,
          index
        ) => {
          const y =
            Number(
              row
                .documentation_ratio
            );

          if (
            row.row_id ===
              null ||
            !Number.isFinite(y)
          ) {
            return;
          }

          const group =
            row.group_fa ||
            'بدون گروه';

          if (
            !byGroup.has(
              group
            )
          ) {
            byGroup.set(
              group,
              []
            );
          }

          byGroup
            .get(group)
            .push({
              x: index,
              y,
              row,
            });
        }
      );

      return [
        ...byGroup.entries(),
      ].map(
        ([id, points]) => ({
          id,
          data: points,
        })
      );
    }, [data]);

  const maxVisits =
    useMemo(
      () =>
        Math.max(
          1,
          ...validRows.map(
            (row) =>
              Number(
                row.V
              ) || 0
          )
        ),
      [validRows]
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

  const chartMinWidth =
    Math.max(
      720,
      data.length * 120
    );

  const legendItems =
    useMemo(
      () =>
        [
          ...groupColors.entries(),
        ].map(
          ([label, color]) => ({
            label,
            color,
          })
        ),
      [groupColors]
    );

  return (
    <section className="glass u-container u-container--md physician-trend-chart">
      <header className="physician-trend-chart__header">
        <div>
          <h3 className="physician-trend-chart__title">
            روند نسبت مستندسازی
          </h3>

          <p className="physician-trend-chart__subtitle">
            اندازه حباب = ویزیت، رنگ حباب = گروه
          </p>
        </div>
      </header>

      {!validRows.length ? (
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
                  left: 80,
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
                  min: 0,
                  max: 1,
                }}
                colors={({
                  serieId,
                }) =>
                  groupColors.get(
                    serieId
                  ) ??
                  'var(--color-blue)'
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
                  legend: 'زمان',
                  legendPosition:
                    'middle',
                  legendOffset: 58,
                }}
                axisLeft={{
                  tickValues: [
                    0,
                    0.25,
                    0.5,
                    0.75,
                    1,
                  ],
                  format: (
                    value
                  ) =>
                    `${Math.round(
                      value *
                        100
                    )}٪`,
                  legend:
                    'نسبت مستندسازی',
                  legendPosition:
                    'middle',
                  legendOffset: -62,
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
                    <PhysicianDocumentationBubbleLayer
                      key="documentation-bubbles"
                      {...layerProps}
                      maxVisits={
                        maxVisits
                      }
                    />
                  ),
                ]}
              />
            </div>
          </div>

          <div className="physician-documentation-bubble__legend">
            <ChartLegend
              items={
                legendItems
              }
            />
          </div>
        </>
      )}
    </section>
  );
};

export default PhysicianDocumentationBubbleChart;