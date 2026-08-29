import React from 'react';
import FacultyImpactWindowCard from './FacultyImpactWindowCard';

const WINDOWS = [
  ['year', 'اثر یک‌ساله (کل داده‌ها)'],
  ['threeMonth', 'اثر سه‌ماهه'],
  ['lastMonth', 'اثر ماه اخیر'],
];

const FacultyImpactMetricCard = ({ title, metricData, globalMax }) => {
  if (!metricData) return null;

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {WINDOWS.map(([key, label]) => (
          <FacultyImpactWindowCard
            key={key}
            label={label}
            windowData={metricData.windows[key]}
            series={metricData.series}
            globalMax={globalMax}
          />
        ))}
      </div>
    </div>
  );
};

export default FacultyImpactMetricCard;