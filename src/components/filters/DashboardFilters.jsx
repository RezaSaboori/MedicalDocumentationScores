import React from 'react';
import './DashboardFilters.css';

const DashboardFilters = () => {
  return (
    <div className="filters-wrapper">
      <div className="filter-group">
        <label className="filter-label">
          فیلتر بر اساس گروه رفتاری:
        </label>
        <div className="glass u-container u-container--sm filter-control">
          Dropdown Placeholder
        </div>
      </div>
      <div className="filter-group">
        <label className="filter-label">
          فیلتر بر اساس سال:
        </label>
        <div className="glass u-container u-container--sm filter-control">
          Dropdown Placeholder
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;