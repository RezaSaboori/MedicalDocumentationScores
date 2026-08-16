import React from 'react';

const KpiCards = () => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: 'var(--spacing-md)', 
      marginBottom: 'var(--spacing-xl)' 
    }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass u-container u-container--sm" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray8)' }}>KPI Title</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-blue)' }}>0</div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;