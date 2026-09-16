const CONFIG = {
  w_excellent: 1.00,
  w_good: 0.70,
  w_acceptable: 0.40,
  w_weak: 0.10,
  w_empty: 0.00,
  rich_min_words: 8,
  shrink_k: 30,
  int_empty_penalty: 1.0,
  pdi_cov: 0.25,
  pdi_wqs: 0.40,
  pdi_int: 0.25,
  pdi_rich: 0.10,
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
    const E = Number(record.E) || 0;
    const G = Number(record.G) || 0;
    const A = Number(record.A) || 0;
    const W = Number(record.W) || 0;
    const Z = Number(record.Z) || 0;
    const V = Number(record.V) || 0;

    const N = E + G + A + W + Z;
    const N_safe = N || 1;
    const V_safe = V || 1;

    const COV = Math.min(1, Math.max(0, (Number(record.D) || 0) / V_safe));
    const rho_Z = Z / N_safe;
    const RICH = Math.min(
      1,
      Math.max(0, (Number(record.avg_words) || 0) / CONFIG.rich_min_words)
    );

    const q_num =
      CONFIG.w_excellent * E +
      CONFIG.w_good * G +
      CONFIG.w_acceptable * A +
      CONFIG.w_weak * W +
      CONFIG.w_empty * Z;

    const WQS = Math.min(1, Math.max(0, q_num / N_safe));

    return {
      ...record,
      V,
      E,
      G,
      A,
      W,
      Z,
      N,
      COV,
      rho_Z,
      RICH,
      WQS,
    };
  });

  const meanWQS = mean(tempRecords.map((record) => record.WQS));
  const meanCOV = mean(tempRecords.map((record) => record.COV));

  const validForLAQ = tempRecords.filter((record) => record.V > 0);

  let slope = 0;
  let intercept = 0;

  if (validForLAQ.length >= 2) {
    const x = validForLAQ.map((record) => Math.log(record.V));
    const y = validForLAQ.map((record) =>
      ebAdjust(record.WQS, record.V, CONFIG.shrink_k, meanWQS)
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
        ebAdjust(record.WQS, record.V, CONFIG.shrink_k, meanWQS) -
        (intercept + slope * Math.log(record.V))
    )
    .sort((a, b) => a - b);

  const laq75 = laqValues.length
    ? laqValues[Math.floor(laqValues.length * 0.75)]
    : 0;

  const finalRecords = tempRecords.map((record) => {
    const WQS_adj = ebAdjust(
      record.WQS,
      record.V,
      CONFIG.shrink_k,
      meanWQS
    );

    const COV_adj = ebAdjust(
      record.COV,
      record.V,
      CONFIG.shrink_k,
      meanCOV
    );

    const WQS_expected_for_load =
      record.V > 0
        ? intercept + slope * Math.log(record.V)
        : WQS_adj;

    const LAQ =
      record.V > 0
        ? WQS_adj - WQS_expected_for_load
        : 0;

    const INT = Math.min(
      1,
      Math.max(0, 1 - CONFIG.int_empty_penalty * record.rho_Z)
    );

    const eps = 1e-9;

    const PDI_noF =
      100 *
      (
        Math.pow(Math.max(eps, COV_adj), CONFIG.pdi_cov) *
        Math.pow(Math.max(eps, WQS_adj), CONFIG.pdi_wqs) *
        Math.pow(Math.max(eps, INT), CONFIG.pdi_int) *
        Math.pow(Math.max(eps, record.RICH), CONFIG.pdi_rich)
      );

    const flags = [];

    if (record.V < CONFIG.flag_low_visits) {
      flags.push('LOW_DATA');
    }

    if (record.rho_Z > CONFIG.flag_empty_rate) {
      flags.push('ENGAGEMENT_TRAINING');
    }

    if (
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

    const {
      F,
      PDI,
      N_noF,
      rho_F,
      rho_Z_noF,
      WQS_noF,
      WQS_noF_adj,
      INT_noF,
      ...cleanRecord
    } = record;

    return {
      ...cleanRecord,
      WQS_adj,
      COV_adj,
      WQS_expected_for_load,
      LAQ,
      INT,
      PDI_noF,
      flags: flags.length ? flags.join('|') : 'OK',
      category,
      year,
    };
  });

  finalRecords.sort(
    (a, b) => b.PDI_noF - a.PDI_noF
  );

  return finalRecords;
};