import React from 'react';
import { BASE_FLAG_FA } from '../../utils/constants';
import './GroupDonutChart.css';

const GroupDonutChart = ({ data = [] }) => {
  // SVG coordinates and radii mapped for a 100x100 viewBox
  const circles = [
    { id: 'a', cx: 35, cy: 40, r: 28, label: BASE_FLAG_FA.INTEGRITY_AUDIT },
    { id: 'b', cx: 65, cy: 40, r: 28, label: BASE_FLAG_FA.ENGAGEMENT_TRAINING },
    { id: 'c', cx: 50, cy: 70, r: 28, label: BASE_FLAG_FA.LOW_DATA },
  ];

  return (
    <div className="glass u-container u-container--md chart-container">
      <h3 className="chart-title">تقاطع گروه‌های رفتاری</h3>
      <div className="venn-wrapper">
        <svg viewBox="0 0 100 100" className="venn-svg">
          {circles.map((circle) => (
            <circle
              key={circle.id}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              className={`circle-${circle.id}`}
            />
          ))}
        </svg>
      </div>
      <div className="venn-legend">
        {circles.map((circle) => (
          <div key={circle.id} className="legend-item">
            <span className={`legend-dot dot-${circle.id}`}></span>
            <span className="legend-label">{circle.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupDonutChart;