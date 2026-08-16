import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardData } from '../services/dataService';

export const useDashboardData = () => {
  const [data, setData] = useState({ current: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    selectedFlags: [],
    selectedYear: 'all',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    data,
    loading,
    filters,
    updateFilters,
  };
};