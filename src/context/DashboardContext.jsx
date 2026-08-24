import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDashboardData, fetchSnapshots } from '../services/dataService';
import { DASHBOARD_MODES, BASE_FLAG_FA } from '../utils/constants';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [rawCurrentData, setRawCurrentData] = useState([]);
  const [rawPreviousData, setRawPreviousData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState(DASHBOARD_MODES.RESIDENTS);

  const [filters, setFilters] = useState({
    selectedYear: 'all',
    selectedFlags: Object.keys(BASE_FLAG_FA),
  });

  const refresh = useCallback(async () => {
    try {
      const snaps = await fetchSnapshots();

      setSnapshots(snaps);

      if (snaps.length > 0) {
        setSelectedPeriod(snaps[0].period);
      } else {
        setSelectedPeriod(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedPeriod) {
      setRawCurrentData([]);
      setRawPreviousData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchDashboardData(selectedPeriod)
      .then((result) => {
        setRawCurrentData(result.current?.data || []);
        setRawPreviousData(result.previous?.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  const { data, availableYears } = useMemo(() => {
    const dbCategory = mode === DASHBOARD_MODES.RESIDENTS ? 'resident' : 'faculty';

    const currentModeData = rawCurrentData.filter((d) => d.category === dbCategory);
    const previousModeData = rawPreviousData.filter((d) => d.category === dbCategory);

    const enrichRow = (row) => {
      const N =
        (row.E || 0) +
        (row.G || 0) +
        (row.A || 0) +
        (row.W || 0) +
        (row.F || 0) +
        (row.Z || 0);

      const N_safe = N || 1;

      return {
        ...row,
        flags: row.flags || 'OK',
        rho_Z: row.Z / N_safe,
        rho_F: row.F / N_safe,
        COV: row.COV_adj || row.D / (row.V || 1),
      };
    };

    const applyFilters = (rows) => {
      return rows.filter((row) => {
        if (
          filters.selectedYear !== 'all' &&
          row.year &&
          String(row.year) !== String(filters.selectedYear)
        ) {
          return false;
        }

        const rowFlags = row.flags ? row.flags.split('|') : ['OK'];
        const hasSelectedFlag = rowFlags.some((f) => filters.selectedFlags.includes(f));

        if (!hasSelectedFlag) return false;

        return true;
      });
    };

    const filteredCurrent = applyFilters(currentModeData);
    const filteredPrevious = applyFilters(previousModeData);

    const yearsSet = new Set(currentModeData.map((r) => r.year).filter(Boolean));
    const years = Array.from(yearsSet).sort();

    const enrichedCurrent = filteredCurrent.map((c) => {
      const prev = filteredPrevious.find((p) => p.name === c.name);
      const enriched = enrichRow(c);

      return {
        ...enriched,
        comparison: prev
          ? {
              PDI: prev.PDI,
              delta_PDI: enriched.PDI - prev.PDI,
              V: prev.V,
              delta_V: enriched.V - prev.V,
            }
          : null,
      };
    });

    return {
      data: {
        current: enrichedCurrent,
        previous: filteredPrevious.map(enrichRow),
      },
      availableYears: years,
    };
  }, [rawCurrentData, rawPreviousData, mode, filters]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const value = {
    data,
    loading,
    error,
    mode,
    setMode,
    filters,
    updateFilters,
    availableYears,
    snapshots,
    selectedPeriod,
    setSelectedPeriod,
    refresh,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }

  return context;
};