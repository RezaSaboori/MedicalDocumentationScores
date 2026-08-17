import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA } from '../../utils/constants';
import { DropdownInput } from '../inputs/DropdownInput';
import './DashboardFilters.css';

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const DashboardFilters = () => {
  const { filters, updateFilters, availableYears } = useDashboard();
  const flagOptions = Object.entries(BASE_FLAG_FA).map(([value, label]) => ({ value, label }));

  // Map options to string arrays for DropdownInput
  const yearDropdownOptions = ['همه سال‌ها', ...availableYears.map(y => `سال ${y}`)];
  const flagDropdownOptions = flagOptions.map(o => o.label);

  const handleFlagChange = (selectedLabels) => {
    const selectedValues = flagOptions
      .filter(o => selectedLabels.includes(o.label))
      .map(o => o.value);
    updateFilters({ selectedFlags: selectedValues });
  };

  const handleYearChange = (val) => {
    if (val === 'همه سال‌ها') {
      updateFilters({ selectedYear: 'all' });
    } else {
      // Convert "سال 1402" -> "1402"
      const yearStr = val.replace('سال ', '');
      updateFilters({ selectedYear: yearStr });
    }
  };

  // Map current state to string values for DropdownInput
  const yearValue = filters.selectedYear === 'all' 
    ? 'همه سال‌ها' 
    : `سال ${filters.selectedYear}`;

  const flagValue = flagOptions
    .filter(o => filters.selectedFlags.includes(o.value))
    .map(o => o.label);

  return (
    <div className="filters-wrapper">
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس گروه رفتاری:</label>
        <DropdownInput
          multiple
          searchable
          dir="rtl"
          options={flagDropdownOptions}
          value={flagValue}
          onChange={handleFlagChange}
          chevronIcon={<ChevronIcon />}
          placeholder="انتخاب گروه..."
        />
      </div>
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس سال:</label>
        <DropdownInput
          searchable
          dir="rtl"
          options={yearDropdownOptions}
          value={yearValue}
          onChange={handleYearChange}
          chevronIcon={<ChevronIcon />}
          placeholder="انتخاب سال..."
        />
      </div>
    </div>
  );
};

export default DashboardFilters;