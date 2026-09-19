import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDashboardData, fetchSnapshots, fetchResidentsMaster } from '../services/dataService';
import { DASHBOARD_MODES, BASE_FLAG_FA } from '../utils/constants';
import { flagGroupLabel, flagGroupColor } from '../utils/flagGroups';
import { enrichScoringGroup } from '../utils/scoring';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [residentsMaster, setResidentsMaster] = useState([]);

  const [rawCurrentData, setRawCurrentData] = useState([]);
  const [rawPreviousData, setRawPreviousData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState(DASHBOARD_MODES.RESIDENTS);

  const [filters, setFilters] = useState({
    selectedYear: 'all',
    selectedFaculty: 'all',
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

  const refreshResidentsMaster = useCallback(async () => {
    try {
      setResidentsMaster(await fetchResidentsMaster());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshResidentsMaster();
  }, [refresh, refreshResidentsMaster]);

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

  const { data, availableYears, availableFaculties } = useMemo(() => {
    // CRITICAL FIX: If a faculty filter is active, switch to 'resident' mode to show their residents.
    // Otherwise, in Faculty mode, show 'faculty' data. In Resident mode, show 'resident' data.
    const isFacultyFilterActive = mode === DASHBOARD_MODES.FACULTY && filters.selectedFaculty !== 'all';
    const dbCategory = (mode === DASHBOARD_MODES.RESIDENTS || isFacultyFilterActive) ? 'resident' : 'faculty';

    const scoreSnapshot = (rows) => [
      ...enrichScoringGroup(
        rows.filter((row) => row.category === 'resident'),
        'resident',
        residentsMaster
      ),
      ...enrichScoringGroup(
        rows.filter((row) => row.category === 'faculty'),
        'faculty'
      ),
    ];

    const scoredCurrentData = scoreSnapshot(rawCurrentData);
    const scoredPreviousData = scoreSnapshot(rawPreviousData);

    const yearByName = new Map(
      residentsMaster.map((r) => [String(r.name || '').replace(/\s+/g, ' ').trim(), r.year])
    );

    const attachYear = (row) =>
      row.category === 'resident'
        ? {
            ...row,
            year:
              yearByName.get(String(row.name || '').replace(/\s+/g, ' ').trim()) ??
              row.year ??
              null,
          }
        : row;

    const currentModeData = scoredCurrentData
      .filter((d) => d.category === dbCategory)
      .map(attachYear);

    const previousModeData = scoredPreviousData
      .filter((d) => d.category === dbCategory)
      .map(attachYear);

    // Extract unique faculty names from resident data regardless of current mode
    const residentRows = scoredCurrentData.filter(d => d.category === 'resident');
    const facultyNamesSet = new Set(
      residentRows.map((r) => r.faculty).filter((f) => f && String(f).trim() !== '')
    );
    const availableFacultyList = Array.from(facultyNamesSet).sort();

    const enrichRow = (row) => {
      const flags = row.flags || 'OK';
      const group_fa = flagGroupLabel(flags);
      const group_color = flagGroupColor(flags);

      return {
        ...row,
        flags,
        group_fa,
        group_color,
        COV:
          row.COV ??
          row.D / (row.V || 1),
      };
    };

    const applyFilters = (rows, includeYear) => {
      return rows.filter((row) => {
        if (
          includeYear &&
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

    const includeYear = mode === DASHBOARD_MODES.RESIDENTS;

    const allCurrent = applyFilters(currentModeData, includeYear);
    const allPrevious = applyFilters(previousModeData, includeYear);

    const inFacultyScope = (rows) =>
      isFacultyFilterActive
        ? rows.filter((r) => String(r.faculty || '').trim() === filters.selectedFaculty)
        : rows;

    const filteredCurrent = inFacultyScope(allCurrent);
    const filteredPrevious = inFacultyScope(allPrevious);

    const yearsSet = new Set(allCurrent.map((r) => r.year).filter(Boolean));
    const years = Array.from(yearsSet).sort();

    const enrichedPrevious = filteredPrevious.map(enrichRow);

    const enrichedCurrent = filteredCurrent.map((c) => {
      const prev = enrichedPrevious.find((p) => p.name === c.name);
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
        previous: enrichedPrevious,
        allCurrent: allCurrent.map(enrichRow),
        allPrevious: allPrevious.map(enrichRow),
      },
      availableYears: years,
      availableFaculties: availableFacultyList,
    };
  }, [rawCurrentData, rawPreviousData, mode, filters, residentsMaster]);
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
    availableFaculties,
    snapshots,
    selectedPeriod,
    setSelectedPeriod,
    refresh,
    refreshResidentsMaster,
    residentsMaster,
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