import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BASE_FLAG_FA, DASHBOARD_MODES } from '../../utils/constants';
import { DropdownInput } from '../inputs/DropdownInput';
import './DashboardFilters.css';

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const DashboardFilters = () => {
  const { filters, updateFilters, availableYears, mode, loading } = useDashboard();

  const flagEntries = Object.entries(BASE_FLAG_FA);
  const totalFlags = flagEntries.length;

  const yearDropdownOptions = ['همه سال‌ها', ...availableYears.map(y => `سال ${y}`)];
  const flagDropdownOptions = flagEntries.map(([_, label]) => label);

  const handleFlagChange = (selectedLabels) => {
    const selectedValues = flagEntries
      .filter(([_, label]) => selectedLabels.includes(label))
      .map(([value]) => value);
    updateFilters({ selectedFlags: selectedValues });
  };

  const handleYearChange = (val) => {
    if (val === 'همه سال‌ها') {
      updateFilters({ selectedYear: 'all' });
    } else {
      const yearStr = val.replace('سال ', '');
      updateFilters({ selectedYear: yearStr });
    }
  };

  const yearValue = filters.selectedYear === 'all'
    ? 'همه سال‌ها'
    : `سال ${filters.selectedYear}`;

  const flagValue = flagEntries
    .filter(([value]) => filters.selectedFlags.includes(value))
    .map(([_, label]) => label);

  const allFlagsSelected = filters.selectedFlags.length === totalFlags;
  const flagDisplayValue = allFlagsSelected ? "همه گروه ها" : undefined;

  return (
    <div className="filters-wrapper">
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس گروه رفتاری:</label>
        <DropdownInput
          multiple
          dir="rtl"
          busy={loading}
          options={flagDropdownOptions}
          value={flagValue}
          onChange={handleFlagChange}
          displayValue={flagDisplayValue}
          chevronIcon={<ChevronIcon />}
          placeholder="انتخاب گروه..."
        />
      </div>
      {mode === DASHBOARD_MODES.RESIDENTS && (
      <div className="filter-group">
        <label className="filter-label">فیلتر بر اساس سال:</label>
        <DropdownInput
          dir="rtl"
          busy={loading}
          options={yearDropdownOptions}
          value={yearValue}
          onChange={handleYearChange}
          chevronIcon={<ChevronIcon />}
          placeholder="انتخاب سال..."
        />
      </div>
      )}
    </div>
  );
};

export default DashboardFilters;