import {
  QUALITY_CLASS_KEYS,
  QUALITY_CLASS_WEIGHTS,
  QUALITY_CLASS_MAX_WEIGHT,
} from './qualityClasses';

const CONFIG = {
  shrink_k: 30,
  int_empty_penalty: 1.0,

  flag_empty_rate: 0.40,
  flag_low_visits: 20,
  flag_exemplar_min_visits: 50,
};

const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const mean = (arr) =>
  arr.reduce((sum, value) => sum + value, 0) / (arr.length || 1);

const ebAdjust = (value, visits, k, meanValue) =>
  (visits * value + k * meanValue) / (visits + k);

export const enrichScoringGroup = (records, category, residentsData = []) => {
  const tempRecords = records.map((record) => {
    const V = Number(record.V) || 0;

    const classCounts = Object.fromEntries(
      QUALITY_CLASS_KEYS.map((key) => [
        key,
        Number(record[key]) || 0,
      ])
    );

    const N = QUALITY_CLASS_KEYS.reduce(
      (sum, key) => sum + classCounts[key],
      0
    );

    const N_safe = N || 1;

    const completedWeight =
      Number(record.completed_weight_sum) || 0;

    const activeWeight =
      Number(record.active_weight_sum) || 0;

    const COV = Math.min(
      1,
      Math.max(
        0,
        activeWeight > 0
          ? completedWeight / activeWeight
          : 0
      )
    );

    const rho_Z = classCounts.Q0 / N_safe;

    const q_num = QUALITY_CLASS_KEYS.reduce(
      (sum, key) =>
        sum +
        QUALITY_CLASS_WEIGHTS[key] *
          classCounts[key],
      0
    );

    const WQS = Math.min(
      1,
      Math.max(
        0,
        q_num /
          (N_safe * QUALITY_CLASS_MAX_WEIGHT)
      )
    );

    return {
      ...record,
      ...classCounts,
      V,
      D: Math.max(0, V - classCounts.Q0),
      N,
      COV,
      rho_Z,
      WQS,
    };
  });

  const scorableRecords = tempRecords.filter(
    (record) => record.N > 0
  );

  const totalScorableDocuments =
    scorableRecords.reduce(
      (sum, record) => sum + record.N,
      0
    );

  const meanWQS =
    totalScorableDocuments > 0
      ? scorableRecords.reduce(
          (sum, record) =>
            sum +
            record.WQS * record.N,
          0
        ) / totalScorableDocuments
      : 0;

  const totalCompletedWeight =
    tempRecords.reduce(
      (sum, record) =>
        sum +
        (Number(record.completed_weight_sum) || 0),
      0
    );

  const totalActiveWeight =
    tempRecords.reduce(
      (sum, record) =>
        sum +
        (Number(record.active_weight_sum) || 0),
      0
    );

  const meanCOV =
    totalActiveWeight > 0
      ? Math.min(
          1,
          Math.max(
            0,
            totalCompletedWeight /
              totalActiveWeight
          )
        )
      : 0;

  const validForLAQ = tempRecords.filter(
    (record) =>
      record.V > 0 &&
      record.N > 0
  );

  let slope = 0;
  let intercept = 0;

  if (validForLAQ.length >= 2) {
    const x = validForLAQ.map((record) => Math.log(record.V));
    const y = validForLAQ.map((record) =>
      ebAdjust(
        record.WQS,
        record.N,
        CONFIG.shrink_k,
        meanWQS
      )
    );

    const n = x.length;
    const sumX = x.reduce((sum, value) => sum + value, 0);
    const sumY = y.reduce((sum, value) => sum + value, 0);
    const sumXY = x.reduce((sum, value, index) => sum + value * y[index], 0);
    const sumX2 = x.reduce((sum, value) => sum + value * value, 0);

    const denominator = n * sumX2 - sumX * sumX;

    if (denominator !== 0) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    }
  }

  const laqValues = validForLAQ
    .map(
      (record) =>
        ebAdjust(
          record.WQS,
          record.N,
          CONFIG.shrink_k,
          meanWQS
        ) -
        (intercept + slope * Math.log(record.V))
    )
    .sort((a, b) => a - b);

  const laq75 = laqValues.length
    ? laqValues[Math.floor(laqValues.length * 0.75)]
    : 0;

  const finalRecords = tempRecords.map((record) => {
    const WQS_adj =
      record.N > 0
        ? ebAdjust(
            record.WQS,
            record.N,
            CONFIG.shrink_k,
            meanWQS
          )
        : 0;

    const COV_adj = ebAdjust(
      record.COV,
      record.V,
      CONFIG.shrink_k,
      meanCOV
    );

    const hasScorableData =
      record.V > 0 &&
      record.N > 0;

    const WQS_expected_for_load =
      hasScorableData
        ? intercept +
          slope * Math.log(record.V)
        : 0;

    const LAQ =
      hasScorableData
        ? WQS_adj -
          WQS_expected_for_load
        : 0;

    const INT = Math.min(
      1,
      Math.max(0, 1 - CONFIG.int_empty_penalty * record.rho_Z)
    );

    const PDI =
      record.N > 0
        ? 100 * record.WQS
        : 0;

    const flags = [];

    if (record.V < CONFIG.flag_low_visits) {
      flags.push('LOW_DATA');
    }

    if (record.rho_Z > CONFIG.flag_empty_rate) {
      flags.push('ENGAGEMENT_TRAINING');
    }

    if (
      record.N > 0 &&
      LAQ >= laq75 &&
      record.V >= CONFIG.flag_exemplar_min_visits
    ) {
      flags.push('EXEMPLAR');
    }

    let year = category === 'resident'
      ? record.year ?? null
      : null;

    if (category === 'resident' && residentsData.length) {
      const match = residentsData.find(
        (resident) =>
          normalize(resident.name) === normalize(record.name)
      );

      if (match) {
        year = match.year;
      }
    }



    return {
      ...record,
      WQS_adj,
      COV_adj,
      WQS_expected_for_load,
      LAQ,
      INT,
      PDI,
      flags: flags.length ? flags.join('|') : 'OK',
      category,
      year,
    };
  });

  finalRecords.sort(
    (a, b) => b.PDI - a.PDI
  );

  return finalRecords;
};