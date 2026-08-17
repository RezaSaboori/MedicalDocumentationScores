import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDashboardData } from '../services/dataService';
import { BASE_FLAG_FA } from '../utils/constants';

export const useDashboardData = () => {
  const [rawData, setRawData] = useState({ current: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    selectedFlags: Object.keys(BASE_FLAG_FA),
    selectedYear: 'all',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      setRawData(result);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return {
    data: filteredData,
    rawData,
    loading,
    filters,
    availableYears,
    updateFilters,
  };
};