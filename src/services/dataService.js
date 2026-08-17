import Papa from 'papaparse';
import { comboLabel } from '../utils/flags';
import { DASHBOARD_MODES } from '../utils/constants';

const CSV_PATHS = {
  [DASHBOARD_MODES.RESIDENTS]: {
    current: '/data/physician_scores_enriched_4405.csv',
    previous: '/data/physician_scores_enriched_3405.csv',
  },
  [DASHBOARD_MODES.FACULTY]: {
    current: '/data/faculty_scores_enriched_4405.csv',
    previous: '/data/faculty_scores_enriched_3405.csv',
  },
};

const parseCsv = (path) =>
  new Promise((resolve, reject) => {
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });

const getNum = (row, key) => {
  const val = row[key] !== undefined ? row[key] : row[`${key} `];
  return val === '' || val === null || val === undefined ? 0 : Number(val);
};

const getStr = (row, key) => {
  const val = row[key] !== undefined ? row[key] : row[`${key} `];
  return (val || '').toString().trim();
};

const mapRow = (row) => {
  const flagsStr = getStr(row, 'flags');
  const flags = flagsStr
    ? flagsStr.split('|').map((f) => f.trim()).filter(Boolean)
    : ['OK'];

  return {
    name: getStr(row, 'name'),
    V: getNum(row, 'V'),
    N: getNum(row, 'N'),
    COV: getNum(row, 'COV'),
    rho_Z: getNum(row, 'rho_Z'),
    rho_F: getNum(row, 'rho_F'),
    WQS_adj: getNum(row, 'WQS_adj'),
    LAQ: getNum(row, 'LAQ'),
    PDI: getNum(row, 'PDI'),
    PDI_noF: getNum(row, 'PDI_noF'),
    E: getNum(row, 'E'),
    A: getNum(row, 'A'),
    G: getNum(row, 'G'),
    W: getNum(row, 'W'),
    F: getNum(row, 'F'),
    Z: getNum(row, 'Z'),
    flags,
    group_fa: comboLabel(flags),
    year: getNum(row, 'year'),
  };
};

const dataCache = {};

export const fetchDashboardData = (mode) => {
  if (!dataCache[mode]) {
    dataCache[mode] = loadDashboardData(mode);
  }
  return dataCache[mode];
};

const loadDashboardData = async (mode) => {
  const paths = CSV_PATHS[mode] || CSV_PATHS[DASHBOARD_MODES.RESIDENTS];
  try {
    const currentRaw = await parseCsv(paths.current);

    let previousRaw = [];
    try {
      previousRaw = await parseCsv(paths.previous);
    } catch (e) {
      console.warn('Previous month CSV not found or failed to parse:', e);
    }

    return {
      current: currentRaw.map(mapRow),
      previous: previousRaw.map(mapRow),
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    return { current: [], previous: [] };
  }
};