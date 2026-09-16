import * as XLSX from 'xlsx';
import { enrichScoringGroup } from './scoring';

const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const cleanName = (text) => normalize(text).replace(/\s*:\s*\d+\s*\/\s*\d+\s*$/, '').trim();

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

const parseNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

const statusToScore = (status) => {
  switch (normalize(status)) {
    case 'عالی': return 5;
    case 'قابل قبول': return 4;
    case 'خوب': return 3;
    case 'ضعیف': return 2;
    case 'خیلی ضعیف': return 1;
    case 'پرونده خالی': return 0;
    default: return 0;
  }
};

const scoreToStatus = (score) => {
  switch (Math.round(score)) {
    case 5: return 'عالی';
    case 4: return 'قابل قبول';
    case 3: return 'خوب';
    case 2: return 'ضعیف';
    case 1: return 'خیلی ضعیف';
    case 0: return 'پرونده خالی';
    default: return 'پرونده خالی';
  }
};

const parseAfrad = (afradStr) => {
  const str = normalize(afradStr);
  let faculty = null;
  let resident = null;

  const facultyMatch = str.match(/پزشک:\s*([^,]+)/);
  if (facultyMatch) faculty = cleanName(facultyMatch[1]);

  const residentMatch = str.match(/رزیدنت:\s*([^,]+)/);
  if (residentMatch) resident = cleanName(residentMatch[1]);

  return { faculty, resident };
};

// Groups raw rows by the given key field, correctly summing counts and weighting averages.
const mergeByName = (rows, keyField) => {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField];
    if (!key) continue;
    
    if (!map.has(key)) {
      map.set(key, { ...row, name: key, V_prev: row.V || 0 });
    } else {
      const existing = map.get(key);
      const prevV = existing.V_prev || 0;
      const currV = row.V || 0;
      const totalV = prevV + currV;

      existing.E += row.E || 0;
      existing.G += row.G || 0;
      existing.A += row.A || 0;
      existing.W += row.W || 0;
      existing.W2 = (existing.W2 || 0) + (row.W2 || 0);
      existing.W1 = (existing.W1 || 0) + (row.W1 || 0);
      existing.Z += row.Z || 0;
      existing.V = totalV;
      existing.D = existing.V - existing.Z;

      if (totalV > 0) {
        existing.C = ((existing.C || 0) * prevV + (row.C || 0) * currV) / totalV;
        existing.U = ((existing.U || 0) * prevV + (row.U || 0) * currV) / totalV;
        existing.avg_chars = ((existing.avg_chars || 0) * prevV + (row.avg_chars || 0) * currV) / totalV;
        existing.avg_words = ((existing.avg_words || 0) * prevV + (row.avg_words || 0) * currV) / totalV;
        existing.quality_score = ((existing.quality_score || 0) * prevV + (row.quality_score || 0) * currV) / totalV;
        existing.density_score = ((existing.density_score || 0) * prevV + (row.density_score || 0) * currV) / totalV;
        existing.supervision_rate = ((existing.supervision_rate || 0) * prevV + (row.supervision_rate || 0) * currV) / totalV;
      }

      if (row.start_date && (!existing.start_date || row.start_date < existing.start_date)) {
        existing.start_date = row.start_date;
      }
      if (row.end_date && (!existing.end_date || row.end_date > existing.end_date)) {
        existing.end_date = row.end_date;
      }

      existing.V_prev = totalV;
    }
  }
  
  return Array.from(map.values()).map(r => {
    const { V_prev, ...rest } = r;
    const totalValid = (rest.E || 0) + (rest.G || 0) + (rest.A || 0) + (rest.W2 || 0) + (rest.W1 || 0) + (rest.Z || 0);
    if (totalValid > 0) {
      const avgScore = (
        (rest.E || 0) * 5 + 
        (rest.G || 0) * 3 + 
        (rest.A || 0) * 4 + 
        (rest.W2 || 0) * 2 + 
        (rest.W1 || 0) * 1 + 
        (rest.Z || 0) * 0
      ) / totalValid;
      rest.combo_status = scoreToStatus(avgScore);
    }
    return rest;
  });
};



export const parseAndProcessExcel = async (file, residentsData = []) => {
  const rawData = await readSheet(file);
  if (!rawData || rawData.length === 0) throw new Error('فایل خالی است.');

  // The new format has headers in the first row
  const headers = rawData[0].map(h => normalize(String(h)).replace(/^\ufeff/, ''));
  const dataRows = rawData.slice(1);

  const colIdx = (name) => headers.findIndex(h => h.includes(name));

  const idxAfrad = colIdx('افراد');
  const idxStatus = colIdx('وضعیت'); 
  const idxDate = colIdx('تاریخ');
  const idxQualityScore = colIdx('امتیاز کیفیت پرونده');
  const idxCompleteness = colIdx('امتیاز کامل بودن متن');
  const idxDensity = colIdx('امتیاز تراکم اطلاعاتی متن');
  const idxNonRepetition = colIdx('امتیاز عدم تکرار کلمات');
  const idxChars = colIdx('تعداد کل کاراکترهای متن');
  const idxWords = colIdx('تعداد کل کلمات متن');
  const idxComboStatus = colIdx('وضعیت ترکیبی');

  if (idxAfrad === -1) {
    throw new Error('ستون «افراد» در فایل یافت نشد. لطفاً فایل صحیح را بارگذاری کنید.');
  }

  const groups = new Map();

  for (const row of dataRows) {
    const afradStr = row[idxAfrad] || '';
    const { faculty, resident } = parseAfrad(afradStr);

    if (!faculty || !resident) continue;

    const groupKey = `${faculty}__${resident}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { faculty, resident, rows: [] });
    }
    groups.get(groupKey).rows.push(row);
  }

  const parsedRows = [];

  for (const [_, group] of groups.entries()) {
    const rows = group.rows;
    const V = rows.length;

    let Z = 0, W = 0, A = 0, G = 0, E = 0;
    let W2 = 0, W1 = 0;
    let sumQuality = 0, countQuality = 0;
    let sumCompleteness = 0, countCompleteness = 0;
    let sumDensity = 0, countDensity = 0;
    let sumNonRepetition = 0, countNonRepetition = 0;
    let sumChars = 0, countChars = 0;
    let sumWords = 0, countWords = 0;
    
    let userSignatures = 0;
    let totalSignatures = 0;

    let minDate = null;
    let maxDate = null;

    for (const row of rows) {
      const comboStatus = idxComboStatus !== -1 ? normalize(row[idxComboStatus]) : '';
      
      if (comboStatus === 'پرونده خالی') Z++;
      else if (comboStatus === 'ضعیف') { W++; W2++; }
      else if (comboStatus === 'خیلی ضعیف') { W++; W1++; }
      else if (comboStatus === 'قابل قبول') A++;
      else if (comboStatus === 'خوب') G++;
      else if (comboStatus === 'عالی') E++;

      if (idxQualityScore !== -1 && row[idxQualityScore] !== '') {
        sumQuality += parseNum(row[idxQualityScore]);
        countQuality++;
      }
      if (idxCompleteness !== -1 && row[idxCompleteness] !== '') {
        sumCompleteness += parseNum(row[idxCompleteness]);
        countCompleteness++;
      }
      if (idxDensity !== -1 && row[idxDensity] !== '') {
        sumDensity += parseNum(row[idxDensity]);
        countDensity++;
      }
      if (idxNonRepetition !== -1 && row[idxNonRepetition] !== '') {
        sumNonRepetition += parseNum(row[idxNonRepetition]);
        countNonRepetition++;
      }
      if (idxChars !== -1 && row[idxChars] !== '') {
        sumChars += parseNum(row[idxChars]);
        countChars++;
      }
      if (idxWords !== -1 && row[idxWords] !== '') {
        sumWords += parseNum(row[idxWords]);
        countWords++;
      }

      if (idxStatus !== -1) {
        const sigStatus = normalize(row[idxStatus]);
        if (sigStatus === 'امضا توسط کاربر' || sigStatus === 'امضای خودکار') {
          totalSignatures++;
          if (sigStatus === 'امضا توسط کاربر') userSignatures++;
        }
      }

      if (idxDate !== -1 && row[idxDate]) {
        const dStr = normalize(row[idxDate]);
        if (!minDate || dStr < minDate) minDate = dStr;
        if (!maxDate || dStr > maxDate) maxDate = dStr;
      }
    }

    const D = V - Z;
    const C = countCompleteness > 0 ? sumCompleteness / countCompleteness : 0;
    const U = countNonRepetition > 0 ? sumNonRepetition / countNonRepetition : 0;
    const avg_chars = countChars > 0 ? sumChars / countChars : 0;
    const avg_words = countWords > 0 ? sumWords / countWords : 0;
    const quality_score = countQuality > 0 ? sumQuality / countQuality : 0;
    const density_score = countDensity > 0 ? sumDensity / countDensity : 0;
    
    const totalValid = E + G + A + W2 + W1 + Z;
    const avgStatusScore = totalValid > 0 ? ((E * 5) + (G * 3) + (A * 4) + (W2 * 2) + (W1 * 1) + (Z * 0)) / totalValid : 0;
    const combo_status = scoreToStatus(avgStatusScore);

    const supervision_rate = totalSignatures > 0 ? userSignatures / totalSignatures : 0;

    parsedRows.push({
      name: group.resident,
      faculty: group.faculty,
      section: null,
      group_fa: null,
      members_count: null,
      review_sign: null,
      V, D, C, U, avg_chars, avg_words, E, G, A, W, Z, W2, W1,
      combo_status,
      supervision_rate,
      quality_score,
      density_score,
      start_date: minDate,
      end_date: maxDate,
    });
  }

  const residents = enrichScoringGroup(
    mergeByName(parsedRows, 'name'),
    'resident',
    residentsData
  );

  const faculty = enrichScoringGroup(
    mergeByName(parsedRows, 'faculty'),
    'faculty'
  );

  // Extract raw documents for database storage
  const colMap = (name) => {
    const idx = colIdx(name);
    return idx !== -1 ? idx : null;
  };

  const documents = dataRows.map(row => ({
    visit_id: row[colMap('شناسه مراجعه')] || '',
    patient_name: row[colMap('نام کامل بیمار')] || '',
    national_id: row[colMap('کدملی بیمار')] || '',
    mobile: row[colMap('موبایل بیمار')] || '',
    doctor_name: row[colMap('نام کامل پزشک')] || '',
    doctor_national_id: row[colMap('کدملی پزشک')] || '',
    doctor_medical_code: row[colMap('کد نظام‌پزشکی پزشک')] || '',
    afrad: row[idxAfrad] || '',
    center_name: row[colMap('نام مرکز')] || '',
    clinic_name: row[colMap('نام کلینیک')] || '',
    clinic_unique_id: row[colMap('شناسه یکتا کلینیک')] || '',
    electronic_record: row[colMap('پرونده الکترونیک')] || '',
    status: row[colMap('وضعیت')] || '',
    date: row[colMap('تاریخ')] || '',
    quality_score: parseNum(row[colMap('امتیاز کیفیت پرونده')]),
    completeness: parseNum(row[colMap('امتیاز کامل بودن متن')]),
    density: parseNum(row[colMap('امتیاز تراکم اطلاعاتی متن')]),
    non_repetition: parseNum(row[colMap('امتیاز عدم تکرار کلمات')]),
    total_chars: parseNum(row[colMap('تعداد کل کاراکترهای متن')]),
    total_words: parseNum(row[colMap('تعداد کل کلمات متن')]),
    combo_status: row[colMap('وضعیت ترکیبی')] || ''
  }));

  let minDate = null;
  let maxDate = null;

  for (const doc of documents) {
    const dStr = normalize(doc.date);

    if (!dStr) continue;
    if (!minDate || dStr < minDate) minDate = dStr;
    if (!maxDate || dStr > maxDate) maxDate = dStr;
  }

  const toPeriod = (dateStr) => {
    const match = String(dateStr || '').match(/^(\d{4})[\/\-](\d{1,2})/);

    if (!match) {
      return 'unknown';
    }

    return `${match[1]}/${match[2].padStart(2, '0')}`;
  };

  const period = toPeriod(maxDate);

  return { documents, residents, faculty, period, startDate: minDate, endDate: maxDate };
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