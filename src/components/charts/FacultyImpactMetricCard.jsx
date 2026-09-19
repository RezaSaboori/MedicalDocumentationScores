import React from 'react';
import ChartContainer from './ChartContainer';
import FacultyImpactWindowCard from './FacultyImpactWindowCard';

const WINDOWS = [
  ['year', 'اثر یک‌ساله'],
  ['threeMonth', 'اثر سه‌ماهه'],
  ['lastMonth', 'اثر ماه اخیر'],
];

const FacultyImpactMetricCard = ({ title, metricData, globalMax }) => {
  if (!metricData) return null;

  return (
    <ChartContainer
      title={title}
      className="chart-container"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-md, 12px)',
        }}
      >
        {WINDOWS.map(([key, label]) => (
          <FacultyImpactWindowCard
            key={key}
            label={label}
            windowData={metricData.windows[key]}
            series={metricData.series[key] || []}
            globalMax={globalMax}
          />
        ))}
      </div>
    </ChartContainer>
  );
};

export default FacultyImpactMetricCard;