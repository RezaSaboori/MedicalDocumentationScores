import React from 'react';
import './KpiCards.css';

const KpiCards = () => {
  return (
    <div className="kpi-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass u-container u-container--sm kpi-card">
          <div className="kpi-title">KPI Title</div>
          <div className="kpi-value">0</div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;