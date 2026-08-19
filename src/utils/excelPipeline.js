import * as XLSX from 'xlsx';

const CONFIG = {
  w_excellent: 1.00,
  w_good: 0.70,
  w_acceptable: 0.40,
  w_weak: 0.10,
  w_empty: 0.00,
  w_fraud: -1.00,
  rich_min_words: 8,
  shrink_k: 30,
  int_fraud_penalty: 3.0,
  int_empty_penalty: 1.0,
  pdi_cov: 0.25,
  pdi_wqs: 0.40,
  pdi_int: 0.25,
  pdi_rich: 0.10,
  flag_fraud_rate: 0.05,
  flag_empty_rate: 0.40,
  flag_low_visits: 20,
  flag_exemplar_min_visits: 50,
};

const COLMAP = {
  'فراگیران': 'name',
  'هیئت علمی': 'faculty',
  'بخش آموزشی': 'section',
  'تعداد ویزیت': 'V',
  'تعداد پرونده تکمیل شده': 'D',
  'میانگین امتیاز کامل بودن متن': 'C',
  'میانگین امتیاز عدم تکرار کلمات': 'U',
  'میانگین تعداد کل کاراکترهای متن': 'avg_chars',
  'میانگین تعداد کل کلمات متن': 'avg_words',
  'تعداد پرونده های Excellent': 'E',
  'تعداد پرونده های Good': 'G',
  'تعداد پرونده های Acceptable': 'A',
  'تعداد پرونده های Weak': 'W',
  'تعداد پرونده های مشکوک به تقلب': 'F',
  'تعداد پرونده های Empty': 'Z',
};

const NUM_KEYS = ['V', 'D', 'C', 'U', 'avg_chars', 'avg_words', 'E', 'G', 'A', 'W', 'F', 'Z'];

const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim();

// Strips trailing ": 48/48" style counters from resident names
const cleanName = (text) =>
  normalize(text).replace(/\s*:\s*\d+\s*\/\s*\d+\s*$/, '').trim();

const readSheet = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const findHeaderRow = (rawData) => {
  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    if (rawData[i].some(cell => String(cell).includes('فراگیران'))) return i;
  }
  return -1;
};

// Groups raw rows by the given key field and sums numeric columns.
const mergeByName = (rows, keyField) => {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField];
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      for (const n of NUM_KEYS) existing[n] += row[n] || 0;
      if (!existing.section && row.section) existing.section = row.section;
    } else {
      const base = { name: key, section: row.section || '' };
      for (const n of NUM_KEYS) base[n] = row[n] || 0;
      map.set(key, base);
    }
  }
  return Array.from(map.values());
};

// DIKW enrichment + empirical Bayes + LAQ + flags, computed WITHIN each group.
const enrichGroup = (records, category, residentsData = []) => {
  const tempRecords = records.map(r => {
    const N = r.E + r.G + r.A + r.W + r.F + r.Z;
    const N_noF = r.E + r.G + r.A + r.W + r.Z;
    const V_safe = r.V || 1;
    const N_safe = N || 1;
    const N_noF_safe = N_noF || 1;

    const COV = Math.min(1, Math.max(0, r.D / V_safe));
    const rho_Z = r.Z / N_safe;
    const rho_F = r.F / N_safe;
    const rho_Z_noF = r.Z / N_noF_safe;
    const RICH = Math.min(1, Math.max(0, (r.avg_words || 0) / CONFIG.rich_min_words));

    const q_num =
      CONFIG.w_excellent * r.E + CONFIG.w_good * r.G + CONFIG.w_acceptable * r.A +
      CONFIG.w_weak * r.W + CONFIG.w_empty * r.Z + CONFIG.w_fraud * r.F;
    const WQS = Math.min(1, Math.max(0, q_num / N_safe));

    const q_num_noF =
      CONFIG.w_excellent * r.E + CONFIG.w_good * r.G + CONFIG.w_acceptable * r.A +
      CONFIG.w_weak * r.W + CONFIG.w_empty * r.Z;
    const WQS_noF = Math.min(1, Math.max(0, q_num_noF / N_noF_safe));

    return { ...r, N, N_noF, COV, rho_Z, rho_F, rho_Z_noF, RICH, WQS, WQS_noF };
  });

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const meanWQS = mean(tempRecords.map(t => t.WQS));
  const meanCOV = mean(tempRecords.map(t => t.COV));
  const meanWQS_noF = mean(tempRecords.map(t => t.WQS_noF));

  const ebAdjust = (val, visits, k, meanVal) => (visits * val + k * meanVal) / (visits + k);

  const validForLAQ = tempRecords.filter(t => t.V > 0);
  let slope = 0, intercept = 0;
  if (validForLAQ.length >= 2) {
    const x = validForLAQ.map(t => Math.log(t.V));
    const y = validForLAQ.map(t => ebAdjust(t.WQS, t.V, CONFIG.shrink_k, meanWQS));
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom !== 0) {
      slope = (n * sumXY - sumX * sumY) / denom;
      intercept = (sumY - slope * sumX) / n;
    }
  }

  const laqValues = validForLAQ
    .map(t => ebAdjust(t.WQS, t.V, CONFIG.shrink_k, meanWQS) - (intercept + slope * Math.log(t.V)))
    .sort((a, b) => a - b);
  const laq75 = laqValues.length ? laqValues[Math.floor(laqValues.length * 0.75)] : 0;

  const finalRecords = tempRecords.map(t => {
    const WQS_adj = ebAdjust(t.WQS, t.V, CONFIG.shrink_k, meanWQS);
    const COV_adj = ebAdjust(t.COV, t.V, CONFIG.shrink_k, meanCOV);
    const WQS_expected_for_load = t.V > 0 ? intercept + slope * Math.log(t.V) : WQS_adj;
    const LAQ = t.V > 0 ? WQS_adj - WQS_expected_for_load : 0;
    const INT = Math.min(1, Math.max(0, 1 - CONFIG.int_fraud_penalty * t.rho_F - CONFIG.int_empty_penalty * t.rho_Z));
    const eps = 1e-9;

    const PDI = 100 * (
      Math.pow(Math.max(eps, COV_adj), CONFIG.pdi_cov) *
      Math.pow(Math.max(eps, WQS_adj), CONFIG.pdi_wqs) *
      Math.pow(Math.max(eps, INT), CONFIG.pdi_int) *
      Math.pow(Math.max(eps, t.RICH), CONFIG.pdi_rich)
    );

    const WQS_noF_adj = ebAdjust(t.WQS_noF, t.V, CONFIG.shrink_k, meanWQS_noF);
    const INT_noF = Math.min(1, Math.max(0, 1 - CONFIG.int_empty_penalty * t.rho_Z_noF));
    const PDI_noF = 100 * (
      Math.pow(Math.max(eps, COV_adj), CONFIG.pdi_cov) *
      Math.pow(Math.max(eps, WQS_noF_adj), CONFIG.pdi_wqs) *
      Math.pow(Math.max(eps, INT_noF), CONFIG.pdi_int) *
      Math.pow(Math.max(eps, t.RICH), CONFIG.pdi_rich)
    );

    const flagsArr = [];
    if (t.V < CONFIG.flag_low_visits) flagsArr.push('LOW_DATA');
    if (t.rho_F > CONFIG.flag_fraud_rate) flagsArr.push('INTEGRITY_AUDIT');
    if (t.rho_Z > CONFIG.flag_empty_rate) flagsArr.push('ENGAGEMENT_TRAINING');
    if (LAQ >= laq75 && t.V >= CONFIG.flag_exemplar_min_visits && !flagsArr.includes('INTEGRITY_AUDIT')) {
      flagsArr.push('EXEMPLAR');
    }

    let year = null;
    if (category === 'resident' && residentsData.length) {
      const match = residentsData.find(res => normalize(res.name) === normalize(t.name));
      if (match) year = match.year;
    }

    return {
      ...t,
      WQS_adj, COV_adj, WQS_expected_for_load, LAQ, INT, PDI,
      WQS_noF_adj, INT_noF, PDI_noF,
      flags: flagsArr.length ? flagsArr.join('|') : 'OK',
      category,
      year,
    };
  });

  finalRecords.sort((a, b) => b.PDI - a.PDI);
  return finalRecords;
};

// Returns BOTH groups: residents (grouped by فراگیران) and
// faculty (grouped by هیئت علمی = combination of their residents).
export const parseAndProcessExcel = async (file, residentsData = []) => {
  const rawData = await readSheet(file);
  const headerRowIndex = findHeaderRow(rawData);
  if (headerRowIndex === -1) {
    throw new Error('ستون «فراگیران» در فایل یافت نشد. لطفاً فایل صحیح را بارگذاری کنید.');
  }

  const headers = rawData[headerRowIndex].map(h => normalize(String(h)).replace(/^\ufeff/, ''));
  const dataRows = rawData.slice(headerRowIndex + 1);

  const parsedRows = [];
  for (const row of dataRows) {
    const record = {};
    for (const [colName, key] of Object.entries(COLMAP)) {
      const idx = headers.indexOf(colName);
      if (idx === -1) continue;
      const val = row[idx];
      if (key === 'name' || key === 'faculty' || key === 'section') {
        record[key] = normalize(String(val || ''));
      } else {
        record[key] = Number(val) || 0;
      }
    }
    record.name = cleanName(record.name);

    if (!record.name || record.name.includes('عنوان گزارش') || record.name === 'میانگین' || record.name === '---') continue;
    parsedRows.push(record);
  }

  const residents = enrichGroup(mergeByName(parsedRows, 'name'), 'resident', residentsData);
  const faculty = enrichGroup(mergeByName(parsedRows, 'faculty'), 'faculty');

  return { residents, faculty };
};

export const parseResidentsCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^\ufeff/, ''));
        const nameIdx = headers.findIndex(h => h.includes('نام') && !h.includes('خانوادگی'));
        const familyIdx = headers.findIndex(h => h.includes('خانوادگی'));
        const yearIdx = headers.findIndex(h => h.includes('سال'));

        const residents = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 3 && nameIdx !== -1 && familyIdx !== -1 && yearIdx !== -1) {
            residents.push({ name: `${cols[nameIdx]} ${cols[familyIdx]}`.trim(), year: cols[yearIdx] });
          }
        }
        resolve(residents);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, 'utf-8');
  });
};