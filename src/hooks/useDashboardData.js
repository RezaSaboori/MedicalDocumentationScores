import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { fetchDashboardData } from '../services/dataService';
import { BASE_FLAG_FA, DASHBOARD_MODES } from '../utils/constants';

const createInitialFilters = () => ({
  selectedFlags: Object.keys(BASE_FLAG_FA),
  selectedYear: 'all',
});

export const useDashboardData = () => {
  const [mode, setModeState] = useState(DASHBOARD_MODES.RESIDENTS);
  const [rawData, setRawData] = useState({ current: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(createInitialFilters);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardData(mode);
      setRawData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setMode = (nextMode) => {
    if (nextMode === mode) return;
    setModeState(nextMode);
    setFilters(createInitialFilters());
  };

  const availableYears = useMemo(() => {
    const years = new Set(rawData.current.map(d => d.year).filter(Boolean));
    return Array.from(years).sort((a, b) => a - b);
  }, [rawData]);

  const filteredData = useMemo(() => {
    let d = rawData.current;
    let prev = rawData.previous;

    if (filters.selectedYear && filters.selectedYear !== 'all') {
      d = d.filter(row => String(row.year) === String(filters.selectedYear));
      prev = prev.filter(row => String(row.year) === String(filters.selectedYear));
    }

    if (filters.selectedFlags && filters.selectedFlags.length > 0) {
      d = d.filter(row => row.flags.some(f => filters.selectedFlags.includes(f)));
      prev = prev.filter(row => row.flags.some(f => filters.selectedFlags.includes(f)));
    }

    return { current: d, previous: prev };
  }, [rawData, filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Charts/KPIs/table read the DEFERRED copy so their heavy re-renders never
  // block urgent UI (mode toggle slide, dropdown open/select). Inputs stay
  // instant; visualization catches up asynchronously.
  const deferredData = useDeferredValue(filteredData);

  return {
    data: deferredData,
    rawData,
    loading,
    filters,
    availableYears,
    updateFilters,
    mode,
    setMode,
  };
};