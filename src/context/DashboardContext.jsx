import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchDashboardData,
  fetchSnapshots,
  fetchResidentsMaster,
  fetchFacultiesMaster,
} from '../services/dataService';
import {
  personNameKey,
  normalizeResidentYear,
  isPersonnelVisible,
} from '../../shared/personnel.js';
import { DASHBOARD_MODES } from '../utils/constants';
import { flagGroupLabel, flagGroupColor } from '../utils/flagGroups';
import { enrichScoringGroup } from '../utils/scoring';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [residentsMaster, setResidentsMaster] = useState([]);
  const [facultiesMaster, setFacultiesMaster] = useState([]);

  const [
    rawCurrentData,
    setRawCurrentData,
  ] = useState([]);

  const [
    rawPreviousData,
    setRawPreviousData,
  ] = useState([]);

  const [
    rawOlderData,
    setRawOlderData,
  ] = useState([]);

  const [
    previousPeriod,
    setPreviousPeriod,
  ] = useState(null);

  const [
    olderPeriod,
    setOlderPeriod,
  ] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState(DASHBOARD_MODES.RESIDENTS);

  const [filters, setFilters] = useState({
    selectedYear: 'all',
    selectedFaculty: 'all',
    reviewResidents: false,
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

  const refreshFacultiesMaster = useCallback(async () => {
    try {
      setFacultiesMaster(await fetchFacultiesMaster());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshResidentsMaster();
    refreshFacultiesMaster();
  }, [refresh, refreshResidentsMaster, refreshFacultiesMaster]);

  useEffect(() => {
    if (!selectedPeriod) {
      setRawCurrentData([]);
      setRawPreviousData([]);
      setRawOlderData([]);

      setPreviousPeriod(
        null
      );

      setOlderPeriod(
        null
      );

      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    fetchDashboardData(
      selectedPeriod
    )
      .then((result) => {
        setRawCurrentData(
          result.current?.data ||
            []
        );

        setRawPreviousData(
          result.previous?.data ||
            []
        );

        setRawOlderData(
          result.older?.data ||
            []
        );

        setPreviousPeriod(
          result.previous
            ?.snapshot
            ?.period ||
            null
        );

        setOlderPeriod(
          result.older
            ?.snapshot
            ?.period ||
            null
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  const { data, availableYears, availableFaculties } = useMemo(() => {
    const isFacultyReviewMode =
      mode === DASHBOARD_MODES.FACULTY &&
      filters.reviewResidents;

    const isFacultyFilterActive =
      isFacultyReviewMode &&
      filters.selectedFaculty !== 'all';

    const dbCategory =
      mode === DASHBOARD_MODES.RESIDENTS
        ? 'resident'
        : isFacultyReviewMode
          ? 'faculty_supervision'
          : 'faculty';

    const residentRegistry = new Map(
      residentsMaster.map((resident) => [
        personNameKey(resident.name),
        resident,
      ])
    );

    const facultyRegistry = new Map(
      facultiesMaster.map((faculty) => [
        personNameKey(faculty.name),
        faculty,
      ])
    );

    const isIncluded = (row) => {
      const key = personNameKey(row.name);

      if (row.category === 'resident') {
        const resident = residentRegistry.get(key);
        return !resident || isPersonnelVisible(resident);
      }

      if (
        row.category === 'faculty' ||
        row.category === 'faculty_supervision'
      ) {
        const faculty = facultyRegistry.get(key);
        return Boolean(faculty && isPersonnelVisible(faculty));
      }

      return false;
    };

    const scoreSnapshot = (rows) => {
      const includedRows = rows.filter(isIncluded);

      return [
        ...enrichScoringGroup(
          includedRows.filter((row) => row.category === 'resident'),
          'resident',
          residentsMaster
        ),

        ...enrichScoringGroup(
          includedRows.filter((row) => row.category === 'faculty'),
          'faculty'
        ),

        ...enrichScoringGroup(
          includedRows.filter(
            (row) => row.category === 'faculty_supervision'
          ),
          'faculty_supervision'
        ),
      ];
    };

    const scoredCurrentData = scoreSnapshot(rawCurrentData);
    const scoredPreviousData = scoreSnapshot(rawPreviousData);
    const scoredOlderData =
      scoreSnapshot(
        rawOlderData
      );
    const yearByName = new Map(
      residentsMaster.map((resident) => [
        personNameKey(resident.name),
        normalizeResidentYear(resident.year),
      ])
    );

    const attachYear = (row) =>
      row.category === 'resident'
        ? {
            ...row,
            year: yearByName.has(personNameKey(row.name))
              ? yearByName.get(personNameKey(row.name))
              : normalizeResidentYear(row.year),
          }
        : row;

    const currentModeData = scoredCurrentData
      .filter((d) => d.category === dbCategory)
      .map(attachYear);

    const previousModeData = scoredPreviousData
      .filter((d) => d.category === dbCategory)
      .map(attachYear);
    const olderModeData =
      scoredOlderData
        .filter(
          (d) =>
            d.category ===
            dbCategory
        )
        .map(
          attachYear
        );


    const availableFacultyList = facultiesMaster
      .filter(isPersonnelVisible)
      .map((faculty) => faculty.name)
      .sort((a, b) => a.localeCompare(b, 'fa'));

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
        if (includeYear && filters.selectedYear !== 'all') {
          const year = normalizeResidentYear(row.year);

          if (filters.selectedYear === 'unknown') {
            if (year !== null) return false;
          } else if (year !== filters.selectedYear) {
            return false;
          }
        }

        return true;
      });
    };

    const includeYear = mode === DASHBOARD_MODES.RESIDENTS;

    const years = ['1', '2', '3', '4'];

    const allCurrent =
      applyFilters(
        currentModeData,
        includeYear
      );

    const allPrevious =
      applyFilters(
        previousModeData,
        includeYear
      );

    const allOlder =
      applyFilters(
        olderModeData,
        includeYear
      );

    const inFacultyScope = (rows) =>
      isFacultyFilterActive
        ? rows.filter(
            (row) =>
              personNameKey(row.name) ===
              personNameKey(filters.selectedFaculty)
          )
        : rows;

    const filteredCurrent =
      inFacultyScope(
        allCurrent
      );

    const filteredPrevious =
      inFacultyScope(
        allPrevious
      );

    const filteredOlder =
      inFacultyScope(
        allOlder
      );

    const enrichedPrevious =
      filteredPrevious.map(
        enrichRow
      );

    const enrichedOlder =
      filteredOlder.map(
        enrichRow
      );

    const enrichedCurrent = filteredCurrent.map((c) => {
      const prev = enrichedPrevious.find(
        (p) => personNameKey(p.name) === personNameKey(c.name)
      );
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
        current:
          enrichedCurrent,

        previous:
          enrichedPrevious,

        older:
          enrichedOlder,

        allCurrent:
          allCurrent.map(
            enrichRow
          ),

        allPrevious:
          allPrevious.map(
            enrichRow
          ),

        allOlder:
          allOlder.map(
            enrichRow
          ),

        periods: {
          current:
            selectedPeriod,

          previous:
            previousPeriod,

          older:
            olderPeriod,
        },
      },
      availableYears: years,
      availableFaculties: availableFacultyList,
    };
  }, [
    rawCurrentData,
    rawPreviousData,
    rawOlderData,
    mode,
    filters,
    residentsMaster,
    facultiesMaster,
    selectedPeriod,
    previousPeriod,
    olderPeriod,
  ]);
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
    refreshFacultiesMaster,
    facultiesMaster,
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