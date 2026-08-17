import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA } from '../../utils/constants';
import './DashboardFilters.css';

const DashboardFilters = () => {
  const { filters, updateFilters, availableYears } = useDashboard();
  const flagOptions = Object.entries(BASE_FLAG_FA).map(([value, label]) => ({ value, label }));

  const handleFlagChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    updateFilters({ selectedFlags: selected });
  };

  const handleYearChange = (e) => {
    updateFilters({ selectedYear: e.target.value });
  };

  return (
    <div className="filters-wrapper">
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس گروه رفتاری:</label>
        <select 
          multiple 
          className="glass u-container u-container--sm filter-control filter-select"
          value={filters.selectedFlags}
          onChange={handleFlagChange}
        >
          {flagOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس سال:</label>
        <select 
          className="glass u-container u-container--sm filter-control filter-select"
          value={filters.selectedYear}
          onChange={handleYearChange}
        >
          <option value="all">همه سال‌ها</option>
          {availableYears.map(y => (
            <option key={y} value={y}>سال {y}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DashboardFilters;