import * as XLSX from 'xlsx';
import { enrichScoringGroup } from './scoring';
import {
  resolveQualityClass,
  qualityWeightToStatus,
  QUALITY_CLASS_WEIGHTS,
} from './qualityClasses';

const normalize = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

const cleanName = (text) =>
  normalize(text)
    .replace(/\s*:\s*\d+\s*\/\s*\d+\s*$/, '')
    .trim();

const readSheet = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(
          new Uint8Array(e.target.result),
          { type: 'array' }
        );

        const worksheet =
          workbook.Sheets[workbook.SheetNames[0]];

        resolve(
          XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          })
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const parseNum = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const parseOptionalNum = (val) => {
  if (
    val === '' ||
    val === null ||
    val === undefined
  ) {
    return null;
  }

  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

const parseAfrad = (afradStr) => {
  const str = normalize(afradStr);

  let faculty = null;
  let resident = null;

  const facultyMatch = str.match(/پزشک:\s*([^,]+)/);

  if (facultyMatch) {
    faculty = cleanName(facultyMatch[1]);
  }

  const residentMatch = str.match(/رزیدنت:\s*([^,]+)/);

  if (residentMatch) {
    resident = cleanName(residentMatch[1]);
  }

  return {
    faculty,
    resident,
  };
};

const mergeByName = (rows, keyField) => {
  const map = new Map();

  const weightedAverageFields = [
    'raw_score',
    'calibrated_score',
    'raw_score_class',
    'calibrated_score_class',
    'reference_sample_count',
    'supervision_rate',
  ];

  for (const row of rows) {
    const key = row[keyField];

    if (!key) {
      continue;
    }

    if (!map.has(key)) {
      map.set(key, {
        ...row,
        name: key,
        V_prev: row.V || 0,
      });

      continue;
    }

    const existing = map.get(key);

    const prevV = existing.V_prev || 0;
    const currV = row.V || 0;
    const totalV = prevV + currV;

    for (
      let classValue = 0;
      classValue <= 5;
      classValue += 1
    ) {
      const keyName = `Q${classValue}`;

      existing[keyName] =
        (existing[keyName] || 0) +
        (row[keyName] || 0);
    }

    existing.V = totalV;

    existing.D =
      existing.V -
      (existing.Q0 || 0);

    existing.completed_weight_sum =
      (existing.completed_weight_sum || 0) +
      (row.completed_weight_sum || 0);

    existing.active_weight_sum =
      (existing.active_weight_sum || 0) +
      (row.active_weight_sum || 0);

    if (totalV > 0) {
      weightedAverageFields.forEach((field) => {
        existing[field] =
          ((existing[field] || 0) * prevV +
            (row[field] || 0) * currV) /
          totalV;
      });
    }

    if (
      row.start_date &&
      (
        !existing.start_date ||
        row.start_date < existing.start_date
      )
    ) {
      existing.start_date = row.start_date;
    }

    if (
      row.end_date &&
      (
        !existing.end_date ||
        row.end_date > existing.end_date
      )
    ) {
      existing.end_date = row.end_date;
    }

    existing.V_prev = totalV;
  }

  return Array.from(map.values()).map((row) => {
    const {
      V_prev,
      ...rest
    } = row;

    const totalClassified = Array.from(
      { length: 6 },
      (_, classValue) =>
        rest[`Q${classValue}`] || 0
    ).reduce(
      (sum, value) => sum + value,
      0
    );

    if (totalClassified > 0) {
      const averageWeight =
        Array.from(
          { length: 6 },
          (_, classValue) => {
            const key =
              `Q${classValue}`;

            return (
              QUALITY_CLASS_WEIGHTS[key] *
              (rest[key] || 0)
            );
          }
        ).reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        totalClassified;

      rest.combo_status =
        qualityWeightToStatus(
          averageWeight
        );
    }

    return rest;
  });
};

export const parseAndProcessExcel = async (
  file,
  residentsData = []
) => {
  const rawData = await readSheet(file);

  if (!rawData || rawData.length === 0) {
    throw new Error('فایل خالی است.');
  }

  const headers = rawData[0].map((header) =>
    normalize(String(header)).replace(
      /^\ufeff/,
      ''
    )
  );

  const dataRows = rawData.slice(1);

  const colIdx = (name) =>
    headers.findIndex(
      (header) => header === name
    );

  const idxAfrad =
    colIdx('افراد');

  const idxStatus =
    colIdx('وضعیت');

  const idxDate =
    colIdx('تاریخ');

  const idxRawScore =
    colIdx('امتیاز خام');

  const idxCalibratedScore =
    colIdx('امتیاز کالیبره');

  const idxRawScoreClass =
    colIdx('کلاس امتیاز خام');

  const idxCalibratedScoreClass =
    colIdx('کلاس امتیاز کالیبره');

  const idxReferenceSampleCount =
    colIdx('تعداد نمونه مرجع');

  const idxCompletedWeight =
    colIdx('مجموع وزن تکمیل‌شده');

  const idxActiveWeight =
    colIdx('مجموع وزن فعال');

  const idxComboStatus =
    colIdx('وضعیت ترکیبی');

  if (idxAfrad === -1) {
    throw new Error(
      'ستون «افراد» در فایل یافت نشد. لطفاً فایل صحیح را بارگذاری کنید.'
    );
  }

  if (
    idxComboStatus === -1 &&
    idxCalibratedScoreClass === -1
  ) {
    throw new Error(
      'حداقل یکی از ستون‌های «وضعیت ترکیبی» یا «کلاس امتیاز کالیبره» باید در فایل وجود داشته باشد.'
    );
  }

  if (
    idxCompletedWeight === -1 ||
    idxActiveWeight === -1
  ) {
    throw new Error(
      'ستون‌های «مجموع وزن تکمیل‌شده» و «مجموع وزن فعال» برای محاسبه امتیاز ضروری هستند.'
    );
  }

  const groups = new Map();

  for (const row of dataRows) {
    const afradStr =
      row[idxAfrad] || '';

    const {
      faculty,
      resident,
    } = parseAfrad(afradStr);

    if (!faculty || !resident) {
      continue;
    }

    const groupKey =
      `${faculty}__${resident}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        faculty,
        resident,
        rows: [],
      });
    }

    groups
      .get(groupKey)
      .rows
      .push(row);
  }

  const parsedRows = [];

  for (const group of groups.values()) {
    const rows = group.rows;

    const V = rows.length;

    const classCounts = {
      Q0: 0,
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
      Q5: 0,
    };

    let sumRawScore = 0;
    let countRawScore = 0;

    let sumCalibratedScore = 0;
    let countCalibratedScore = 0;

    let sumRawScoreClass = 0;
    let countRawScoreClass = 0;

    let sumCalibratedScoreClass = 0;
    let countCalibratedScoreClass = 0;

    let sumReferenceSamples = 0;
    let countReferenceSamples = 0;

    let completedWeightSum = 0;
    let activeWeightSum = 0;

    let userSignatures = 0;
    let totalSignatures = 0;

    let minDate = null;
    let maxDate = null;

    for (const row of rows) {
      const comboStatus =
        idxComboStatus !== -1
          ? normalize(
              row[idxComboStatus]
            )
          : '';

      const calibratedClass =
        idxCalibratedScoreClass !== -1
          ? row[
              idxCalibratedScoreClass
            ]
          : null;

      const qualityClass =
        resolveQualityClass(
          comboStatus,
          calibratedClass
        );

      if (qualityClass !== null) {
        classCounts[
          `Q${qualityClass}`
        ] += 1;
      }

      if (
        idxRawScore !== -1 &&
        row[idxRawScore] !== ''
      ) {
        sumRawScore +=
          parseNum(
            row[idxRawScore]
          );

        countRawScore += 1;
      }

      if (
        idxCalibratedScore !== -1 &&
        row[idxCalibratedScore] !== ''
      ) {
        sumCalibratedScore +=
          parseNum(
            row[idxCalibratedScore]
          );

        countCalibratedScore += 1;
      }

      if (
        idxRawScoreClass !== -1 &&
        row[idxRawScoreClass] !== ''
      ) {
        sumRawScoreClass +=
          parseNum(
            row[idxRawScoreClass]
          );

        countRawScoreClass += 1;
      }

      if (
        idxCalibratedScoreClass !== -1 &&
        row[idxCalibratedScoreClass] !== ''
      ) {
        sumCalibratedScoreClass +=
          parseNum(
            row[
              idxCalibratedScoreClass
            ]
          );

        countCalibratedScoreClass += 1;
      }

      if (
        idxReferenceSampleCount !== -1 &&
        row[
          idxReferenceSampleCount
        ] !== ''
      ) {
        sumReferenceSamples +=
          parseNum(
            row[
              idxReferenceSampleCount
            ]
          );

        countReferenceSamples += 1;
      }

      if (
        idxCompletedWeight !== -1 &&
        row[idxCompletedWeight] !== ''
      ) {
        completedWeightSum +=
          parseNum(
            row[idxCompletedWeight]
          );
      }

      if (
        idxActiveWeight !== -1 &&
        row[idxActiveWeight] !== ''
      ) {
        activeWeightSum +=
          parseNum(
            row[idxActiveWeight]
          );
      }

      if (idxStatus !== -1) {
        const sigStatus =
          normalize(
            row[idxStatus]
          );

        if (
          sigStatus ===
            'امضا توسط کاربر' ||
          sigStatus ===
            'امضای خودکار'
        ) {
          totalSignatures += 1;

          if (
            sigStatus ===
            'امضا توسط کاربر'
          ) {
            userSignatures += 1;
          }
        }
      }

      if (
        idxDate !== -1 &&
        row[idxDate]
      ) {
        const dateString =
          normalize(
            row[idxDate]
          );

        if (
          !minDate ||
          dateString < minDate
        ) {
          minDate = dateString;
        }

        if (
          !maxDate ||
          dateString > maxDate
        ) {
          maxDate = dateString;
        }
      }
    }

    const D =
      V - classCounts.Q0;

    const raw_score =
      countRawScore > 0
        ? sumRawScore /
          countRawScore
        : 0;

    const calibrated_score =
      countCalibratedScore > 0
        ? sumCalibratedScore /
          countCalibratedScore
        : 0;

    const raw_score_class =
      countRawScoreClass > 0
        ? sumRawScoreClass /
          countRawScoreClass
        : 0;

    const calibrated_score_class =
      countCalibratedScoreClass > 0
        ? sumCalibratedScoreClass /
          countCalibratedScoreClass
        : 0;

    const reference_sample_count =
      countReferenceSamples > 0
        ? sumReferenceSamples /
          countReferenceSamples
        : 0;

    const totalClassified =
      Object.values(
        classCounts
      ).reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const averageWeight =
      totalClassified > 0
        ? Object.entries(
            classCounts
          ).reduce(
            (
              sum,
              [key, count]
            ) =>
              sum +
              QUALITY_CLASS_WEIGHTS[key] *
                count,
            0
          ) /
          totalClassified
        : null;

    const combo_status =
      qualityWeightToStatus(
        averageWeight
      );

    const supervision_rate =
      totalSignatures > 0
        ? userSignatures /
          totalSignatures
        : 0;

    parsedRows.push({
      name: group.resident,
      faculty: group.faculty,

      section: null,
      group_fa: null,
      members_count: null,
      review_sign: null,

      V,
      D,

      ...classCounts,

      raw_score,
      calibrated_score,
      raw_score_class,
      calibrated_score_class,
      reference_sample_count,

      completed_weight_sum:
        completedWeightSum,

      active_weight_sum:
        activeWeightSum,

      combo_status,
      supervision_rate,

      start_date: minDate,
      end_date: maxDate,
    });
  }

  const residents =
    enrichScoringGroup(
      mergeByName(
        parsedRows,
        'name'
      ),
      'resident',
      residentsData
    );

  const faculty =
    enrichScoringGroup(
      mergeByName(
        parsedRows,
        'faculty'
      ),
      'faculty'
    );

  const colMap = (name) => {
    const idx = colIdx(name);

    return idx !== -1
      ? idx
      : null;
  };

  const getCell = (
    row,
    columnName
  ) => {
    const index =
      colMap(columnName);

    if (index === null) {
      return '';
    }

    return row[index];
  };

  const documents =
    dataRows.map((row) => ({
      visit_id:
        getCell(
          row,
          'شناسه مراجعه'
        ) || '',

      patient_name:
        getCell(
          row,
          'نام کامل بیمار'
        ) || '',

      national_id:
        getCell(
          row,
          'کدملی بیمار'
        ) || '',

      mobile:
        getCell(
          row,
          'موبایل بیمار'
        ) || '',

      doctor_name:
        getCell(
          row,
          'نام کامل پزشک'
        ) || '',

      doctor_national_id:
        getCell(
          row,
          'کدملی پزشک'
        ) || '',

      doctor_medical_code:
        getCell(
          row,
          'کد نظام‌پزشکی پزشک'
        ) || '',

      afrad:
        idxAfrad !== -1
          ? row[idxAfrad] || ''
          : '',

      center_name:
        getCell(
          row,
          'نام مرکز'
        ) || '',

      clinic_name:
        getCell(
          row,
          'نام کلینیک'
        ) || '',

      clinic_unique_id:
        getCell(
          row,
          'شناسه یکتا کلینیک'
        ) || '',

      electronic_record:
        getCell(
          row,
          'پرونده الکترونیک'
        ) || '',

      status:
        getCell(
          row,
          'وضعیت'
        ) || '',

      date:
        getCell(
          row,
          'تاریخ'
        ) || '',

      raw_score:
        parseOptionalNum(
          getCell(
            row,
            'امتیاز خام'
          )
        ),

      calibrated_score:
        parseOptionalNum(
          getCell(
            row,
            'امتیاز کالیبره'
          )
        ),

      raw_score_class:
        parseOptionalNum(
          getCell(
            row,
            'کلاس امتیاز خام'
          )
        ),

      calibrated_score_class:
        parseOptionalNum(
          getCell(
            row,
            'کلاس امتیاز کالیبره'
          )
        ),

      reference_sample_count:
        parseOptionalNum(
          getCell(
            row,
            'تعداد نمونه مرجع'
          )
        ),

      completed_weight_sum:
        parseOptionalNum(
          getCell(
            row,
            'مجموع وزن تکمیل‌شده'
          )
        ),

      active_weight_sum:
        parseOptionalNum(
          getCell(
            row,
            'مجموع وزن فعال'
          )
        ),

      combo_status:
        getCell(
          row,
          'وضعیت ترکیبی'
        ) || '',
    }));

  let minDate = null;
  let maxDate = null;

  for (const doc of documents) {
    const dateString =
      normalize(doc.date);

    if (!dateString) {
      continue;
    }

    if (
      !minDate ||
      dateString < minDate
    ) {
      minDate = dateString;
    }

    if (
      !maxDate ||
      dateString > maxDate
    ) {
      maxDate = dateString;
    }
  }

  const toPeriod = (dateStr) => {
    const match =
      String(dateStr || '').match(
        /^(\d{4})[\/\-](\d{1,2})/
      );

    if (!match) {
      return 'unknown';
    }

    return `${match[1]}/${match[2].padStart(
      2,
      '0'
    )}`;
  };

  const period =
    toPeriod(maxDate);

  return {
    documents,
    residents,
    faculty,
    period,
    startDate: minDate,
    endDate: maxDate,
  };
};

export const parseResidentsCSV = async (
  file
) =>
  new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = (e) => {
        try {
          const text =
            e.target.result;

          const lines =
            text
              .split('\n')
              .filter((line) =>
                line.trim()
              );

          if (
            lines.length === 0
          ) {
            resolve([]);
            return;
          }

          const headers =
            lines[0]
              .split(',')
              .map((header) =>
                header
                  .trim()
                  .replace(
                    /^\ufeff/,
                    ''
                  )
              );

          const nameIdx =
            headers.findIndex(
              (header) =>
                header.includes(
                  'نام'
                ) &&
                !header.includes(
                  'خانوادگی'
                )
            );

          const familyIdx =
            headers.findIndex(
              (header) =>
                header.includes(
                  'خانوادگی'
                )
            );

          const yearIdx =
            headers.findIndex(
              (header) =>
                header.includes(
                  'سال'
                )
            );

          const residents = [];

          for (
            let i = 1;
            i < lines.length;
            i += 1
          ) {
            const cols =
              lines[i]
                .split(',')
                .map((column) =>
                  column.trim()
                );

            if (
              nameIdx === -1 ||
              familyIdx === -1 ||
              yearIdx === -1
            ) {
              continue;
            }

            const name =
              `${cols[nameIdx] || ''} ${
                cols[familyIdx] || ''
              }`.trim();

            if (!name) {
              continue;
            }

            residents.push({
              name,
              year:
                cols[yearIdx] || '',
            });
          }

          resolve(residents);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror =
        (error) =>
          reject(error);

      reader.readAsText(
        file,
        'utf-8'
      );
    }
  );