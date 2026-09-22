import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useDashboard } from '../../context/DashboardContext';
import BubbleNodesLayer from './BubbleNodesLayer';
import ChartContainer from './ChartContainer';
import LoadVsQualityMetricControl, {
  LOAD_QUALITY_METRICS,
} from './LoadVsQualityMetricControl';
import './LoadVsQualityChart.css';

const METRIC_CONFIG = {
  [LOAD_QUALITY_METRICS.CALIBRATED]: {
    label:
      'میانگین نمرات پرونده‌ها (کالیبره‌شده)',
  },

  [LOAD_QUALITY_METRICS.RAW]: {
    label:
      'میانگین نمرات پرونده‌ها (خام)',
  },
};

const LoadVsQualityChart = () => {
  const { data } = useDashboard();

  const d = data.current;

  const [
    verticalMetric,
    setVerticalMetric,
  ] = useState(
    LOAD_QUALITY_METRICS.CALIBRATED
  );

  const metricConfig =
    METRIC_CONFIG[
      verticalMetric
    ];

  // Data-sample check: proves V/N reach the chart (CSV headers may carry trailing spaces).
  useEffect(() => {
    console.info('[LoadVsQuality] data sample:', d.slice(0, 3).map((r) => ({ name: r.name, V: r.V, N: r.N })));
  }, [d]);

  const series = useMemo(() => {
    const byGroup =
      new Map();

    d.forEach((row) => {
      const sourceValue =
        row[verticalMetric];

      if (
        sourceValue === null ||
        sourceValue === undefined ||
        sourceValue === ''
      ) {
        return;
      }

      const y =
        Number(sourceValue);

      if (
        !Number.isFinite(y)
      ) {
        return;
      }

      const group =
        row.group_fa ||
        'بدون گروه';

      if (
        !byGroup.has(group)
      ) {
        byGroup.set(
          group,
          []
        );
      }

      byGroup
        .get(group)
        .push({
          ...row,
          x: Math.max(
            Number(row.V) || 0,
            1
          ),
          y,
        });
    });

    return [
      ...byGroup.entries(),
    ].map(
      ([id, points]) => ({
        id,
        data: points,
      })
    );
  }, [
    d,
    verticalMetric,
  ]);

  const colorByGroup = useMemo(
    () => new Map(d.map((r) => [r.group_fa, r.group_color])),
    [d]
  );

  const maxPDI = useMemo(
    () =>
      Math.max(
        1,
        ...d.map(
          (row) =>
            Number(row.PDI) || 0
        )
      ),
    [d]
  );

  const maxV = useMemo(
    () =>
      Math.max(
        10,
        ...d.map(
          (row) =>
            Number(row.V) || 1
        )
      ),
    [d]
  );

  const xTickValues = useMemo(() => {
    const limit = Math.ceil(maxV * 1.25);
    const ticks = [];
    for (let decade = 1; decade <= limit; decade *= 10) {
      for (const m of [1, 2, 5]) {
        const v = decade * m;
        if (v <= limit) ticks.push(v);
      }
    }
    return ticks;
  }, [maxV]);
  const meanMetric = useMemo(() => {
    const values =
      d
        .map(
          (row) =>
            row[verticalMetric]
        )
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== '' &&
            Number.isFinite(
              Number(value)
            )
        )
        .map(Number);

    if (!values.length) {
      return 0;
    }

    return (
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length
    );
  }, [
    d,
    verticalMetric,
  ]);

  const MeanLineLayer = ({
    yScale,
    innerWidth,
  }) => {
    const y =
      yScale(meanMetric);
    if (!Number.isFinite(y)) return null; // empty data → auto scale is NaN
    return (
      <g>
        <line x1={0} x2={innerWidth} y1={y} y2={y} stroke="grey" strokeDasharray="6 4" />
        <text x={innerWidth} y={y - 6} textAnchor="end" className="chart-axis-text">
          میانگین انستیتو
        </text>
      </g>
    );
  };

  if (!d.length) {
    return (
      <ChartContainer
        title="حجم ویزیت در برابر میانگین نمرات پرونده‌ها"
        subtitle="اندازه حباب = امتیاز کیفیت ثبت پرونده‌ها"
        className="lvq-container"
        legendItems={[]}
        headerActions={
          <LoadVsQualityMetricControl
            value={
              verticalMetric
            }
            onChange={
              setVerticalMetric
            }
          />
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, color: 'var(--color-gray8)', fontFamily: 'var(--font-family-base)' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title="حجم ویزیت در برابر میانگین نمرات پرونده‌ها"
      subtitle="اندازه حباب = امتیاز کیفیت ثبت پرونده‌ها"
      className="lvq-container"
      headerActions={
        <LoadVsQualityMetricControl
          value={
            verticalMetric
          }
          onChange={
            setVerticalMetric
          }
        />
      }
      legendItems={series.map((item) => ({
        label: item.id,
        color:
          colorByGroup.get(
            item.id
          ),
      }))}
    >
      <div className="lvq-body" dir="ltr" style={{ height: 420 }}>
        <ResponsiveScatterPlot
          data={series}
          xScale={{ type: 'log', base: 10, min: 1, max: Math.ceil(maxV * 1.25) }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          margin={{ top: 16, right: 24, bottom: 64, left: 64 }}
          colors={({ serieId }) => colorByGroup.get(serieId) ?? '#1f77b4'}
          layers={[
            'grid',
            'axes',
            (layerProps) => <MeanLineLayer key="mean" {...layerProps} />,
            (layerProps) => (
              <BubbleNodesLayer
                key="bubbles"
                {...layerProps}
                sizeKey="PDI"
                maxValue={
                  maxPDI
                }
              />
            ),
          ]}
          axisBottom={{
            legend: 'تعداد ویزیت (مقیاس لگاریتمی)',
            legendPosition: 'middle',
            legendOffset: 46,
            tickValues: xTickValues,
          }}
          axisLeft={{
            legend:
              metricConfig.label,
            legendPosition:
              'middle',
            legendOffset: -46,
          }}
        />
      </div>
    </ChartContainer>
  );
};

export default LoadVsQualityChart;