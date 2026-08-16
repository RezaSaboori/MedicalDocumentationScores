import React from 'react';

const DashboardFilters = () => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '260px' }}>
        <label style={{ fontWeight: 'var(--font-weight-semibold)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
          فیلتر بر اساس گروه رفتاری:
        </label>
        <div className="glass u-container u-container--sm" style={{ padding: 'var(--spacing-sm)', color: 'var(--color-gray8)' }}>
          Dropdown Placeholder
        </div>
      </div>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ fontWeight: 'var(--font-weight-semibold)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
          فیلتر بر اساس سال:
        </label>
        <div className="glass u-container u-container--sm" style={{ padding: 'var(--spacing-sm)', color: 'var(--color-gray8)' }}>
          Dropdown Placeholder
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;