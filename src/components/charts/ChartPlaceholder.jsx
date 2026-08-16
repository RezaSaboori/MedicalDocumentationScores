import React from 'react';

const ChartPlaceholder = ({ title, height = '400px' }) => {
  return (
    <div 
      className="glass u-container u-container--md" 
      style={{ 
        minHeight: height, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <h3 style={{ color: 'var(--color-gray10)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-gray7)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
        Chart Implementation Pending (Nivo/Visx)
      </p>
    </div>
  );
};

export default ChartPlaceholder;