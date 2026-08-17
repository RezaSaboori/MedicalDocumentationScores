import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA } from '../../utils/constants';
import './GroupDonutChart.css';

const GroupDonutChart = () => {
  const { data } = useDashboard();
  const d = data.current;

  const counts = useMemo(() => {
    const integrity = new Set(d.filter(r => r.flags.includes('INTEGRITY_AUDIT')).map(r => r.name));
    const engagement = new Set(d.filter(r => r.flags.includes('ENGAGEMENT_TRAINING')).map(r => r.name));
    const lowData = new Set(d.filter(r => r.flags.includes('LOW_DATA')).map(r => r.name));
    return {
      a: [...integrity].filter(x => !engagement.has(x) && !lowData.has(x)).length,
      b: [...engagement].filter(x => !integrity.has(x) && !lowData.has(x)).length,
      c: [...lowData].filter(x => !integrity.has(x) && !engagement.has(x)).length,
    };
  }, [d]);

  const circles = [
    { id: 'a', cx: 35, cy: 40, r: 28, label: `${BASE_FLAG_FA.INTEGRITY_AUDIT} (${counts.a})` },
    { id: 'b', cx: 65, cy: 40, r: 28, label: `${BASE_FLAG_FA.ENGAGEMENT_TRAINING} (${counts.b})` },
    { id: 'c', cx: 50, cy: 70, r: 28, label: `${BASE_FLAG_FA.LOW_DATA} (${counts.c})` },
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