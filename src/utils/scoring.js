import {
  QUALITY_CLASS_KEYS,
  QUALITY_CLASS_WEIGHTS,
  QUALITY_CLASS_MAX_WEIGHT,
} from './qualityClasses';
import { PDI_THRESHOLD } from './constants';

const CONFIG = {
  shrink_k: 30,

  flag_empty_rate: 0.40,
  flag_low_documents: 20,
  flag_exemplar_min_documents: 50,
  flag_exemplar_min_pdi: PDI_THRESHOLD,
};

const normalize = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

const ebAdjust = (
  value,
  sampleSize,
  k,
  meanValue
) => {
  if (sampleSize <= 0) {
    return 0;
  }

  return (
    sampleSize * value +
    k * meanValue
  ) / (
    sampleSize + k
  );
};

const percentile75 = (values) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const index = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * 0.75)
  );

  return sorted[index];
};

export const enrichScoringGroup = (
  records,
  category,
  residentsData = []
) => {
  const tempRecords = records.map(
    (record) => {
      const V =
        Number(record.V) || 0;

      const classCounts =
        Object.fromEntries(
          QUALITY_CLASS_KEYS.map(
            (key) => [
              key,
              Math.max(
                0,
                Number(record[key]) || 0
              ),
            ]
          )
        );

      const N =
        QUALITY_CLASS_KEYS.reduce(
          (sum, key) =>
            sum + classCounts[key],
          0
        );

      const Q0 =
        classCounts.Q0 || 0;

      const D =
        Math.max(
          0,
          V - Q0
        );

      /*
       * Original COV philosophy:
       * proportion of visits with documentation.
       */
      const COV =
        V > 0
          ? Math.min(
              1,
              Math.max(
                0,
                D / V
              )
            )
          : 0;

      /*
       * New diagnostic metric:
       * completion of applicable documentation weight.
       *
       * This is deliberately NOT used in PDI because
       * it is closely related to the source score from
       * which the calibrated quality class is derived.
       */
      const completedWeight =
        Number(
          record.completed_weight_sum
        ) || 0;

      const activeWeight =
        Number(
          record.active_weight_sum
        ) || 0;

      const COMP =
        activeWeight > 0
          ? Math.min(
              1,
              Math.max(
                0,
                completedWeight /
                  activeWeight
              )
            )
          : 0;

      /*
       * Empty-documentation rate.
       */
      const rho_Z =
        N > 0
          ? Q0 / N
          : 0;

      /*
       * Weighted documentation quality.
       *
       * Class weights:
       * Q0 = 0
       * Q1 = 3
       * Q2 = 4
       * Q3 = 5
       * Q4 = 6
       * Q5 = 8
       *
       * Division by maxWeight=8 normalizes WQS to 0..1.
       */
      const weightedQualitySum =
        QUALITY_CLASS_KEYS.reduce(
          (sum, key) =>
            sum +
            QUALITY_CLASS_WEIGHTS[key] *
              classCounts[key],
          0
        );

      const WQS =
        N > 0
          ? Math.min(
              1,
              Math.max(
                0,
                weightedQualitySum /
                  (
                    N *
                    QUALITY_CLASS_MAX_WEIGHT
                  )
              )
            )
          : 0;

      /*
       * Primary physician documentation score.
       *
       * Sample size does not alter the semantic meaning
       * of the physician's observed quality.
       */
      const PDI =
        N > 0
          ? 100 * WQS
          : 0;

      return {
        ...record,
        ...classCounts,

        V,
        D,
        N,

        COV,
        COMP,
        rho_Z,

        WQS,
        PDI,
      };
    }
  );

  /*
   * Pooled document-level institutional WQS.
   *
   * A physician with 5 records must not contribute
   * the same amount to the prior mean as one with
   * 300 records.
   */
  const scorableRecords =
    tempRecords.filter(
      (record) =>
        record.N > 0
    );

  const totalScorableDocuments =
    scorableRecords.reduce(
      (sum, record) =>
        sum + record.N,
      0
    );

  const meanWQS =
    totalScorableDocuments > 0
      ? scorableRecords.reduce(
          (sum, record) =>
            sum +
            record.WQS *
              record.N,
          0
        ) /
        totalScorableDocuments
      : 0;

  /*
   * Pooled raw coverage.
   *
   * COV follows the original D/V definition,
   * therefore the institutional mean should also
   * be calculated as total D / total V.
   */
  const totalVisits =
    tempRecords.reduce(
      (sum, record) =>
        sum + record.V,
      0
    );

  const totalDocumentedVisits =
    tempRecords.reduce(
      (sum, record) =>
        sum + record.D,
      0
    );

  const meanCOV =
    totalVisits > 0
      ? Math.min(
          1,
          Math.max(
            0,
            totalDocumentedVisits /
              totalVisits
          )
        )
      : 0;

  /*
   * LAQ is calculated only where both workload
   * and classified documentation data exist.
   */
  const validForLAQ =
    tempRecords.filter(
      (record) =>
        record.V > 0 &&
        record.N > 0
    );

  let slope = 0;
  let intercept = meanWQS;

  if (
    validForLAQ.length >= 2
  ) {
    const x =
      validForLAQ.map(
        (record) =>
          Math.log(record.V)
      );

    const y =
      validForLAQ.map(
        (record) =>
          ebAdjust(
            record.WQS,
            record.N,
            CONFIG.shrink_k,
            meanWQS
          )
      );

    const n = x.length;

    const sumX =
      x.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const sumY =
      y.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const sumXY =
      x.reduce(
        (
          sum,
          value,
          index
        ) =>
          sum +
          value * y[index],
        0
      );

    const sumX2 =
      x.reduce(
        (sum, value) =>
          sum +
          value * value,
        0
      );

    const denominator =
      n * sumX2 -
      sumX * sumX;

    if (
      Math.abs(
        denominator
      ) > Number.EPSILON
    ) {
      slope =
        (
          n * sumXY -
          sumX * sumY
        ) /
        denominator;

      intercept =
        (
          sumY -
          slope * sumX
        ) /
        n;
    }
  }

  /*
   * Calculate LAQ once so the exemplar threshold
   * can be based on the current population.
   */
  const recordsWithStatistics =
    tempRecords.map(
      (record) => {
        const WQS_adj =
          record.N > 0
            ? ebAdjust(
                record.WQS,
                record.N,
                CONFIG.shrink_k,
                meanWQS
              )
            : 0;

        const COV_adj =
          record.V > 0
            ? ebAdjust(
                record.COV,
                record.V,
                CONFIG.shrink_k,
                meanCOV
              )
            : 0;

        const hasScorableData =
          record.V > 0 &&
          record.N > 0;

        const WQS_expected_for_load =
          hasScorableData
            ? intercept +
              slope *
                Math.log(
                  record.V
                )
            : 0;

        const LAQ =
          hasScorableData
            ? WQS_adj -
              WQS_expected_for_load
            : 0;

        /*
         * Kept as a descriptive compatibility
         * metric only. It is no longer part of PDI.
         */
        const INT =
          record.N > 0
            ? Math.min(
                1,
                Math.max(
                  0,
                  1 -
                    record.rho_Z
                )
              )
            : 0;

        return {
          ...record,

          WQS_adj,
          COV_adj,
          WQS_expected_for_load,

          LAQ,
          INT,
        };
      }
    );

  const laq75 =
    percentile75(
      recordsWithStatistics
        .filter(
          (record) =>
            record.N >=
              CONFIG
                .flag_exemplar_min_documents &&
            Number.isFinite(
              record.LAQ
            )
        )
        .map(
          (record) =>
            record.LAQ
        )
    );

  const finalRecords =
    recordsWithStatistics.map(
      (record) => {
        const flags = [];

        /*
         * LOW_DATA reflects confidence only.
         * It does not modify PDI.
         */
        if (
          record.N <
          CONFIG.flag_low_documents
        ) {
          flags.push(
            'LOW_DATA'
          );
        }

        /*
         * Same conceptual rule as the
         * original empty-record behavior flag.
         */
        if (
          record.rho_Z >
          CONFIG.flag_empty_rate
        ) {
          flags.push(
            'ENGAGEMENT_TRAINING'
          );
        }

        /*
         * Exemplar must satisfy:
         * 1. sufficient classified documents,
         * 2. workload-adjusted quality in the
         *    upper quartile,
         * 3. absolute PDI at least at the
         *    minimum acceptable level.
         */
        if (
          record.N >=
            CONFIG
              .flag_exemplar_min_documents &&
          record.PDI >=
            CONFIG
              .flag_exemplar_min_pdi &&
          record.LAQ >=
            laq75
        ) {
          flags.push(
            'EXEMPLAR'
          );
        }

        let year =
          category === 'resident'
            ? record.year ??
              null
            : null;

        if (
          category ===
            'resident' &&
          residentsData.length
        ) {
          const match =
            residentsData.find(
              (resident) =>
                normalize(
                  resident.name
                ) ===
                normalize(
                  record.name
                )
            );

          if (match) {
            year =
              match.year;
          }
        }

        return {
          ...record,

          flags:
            flags.length
              ? flags.join('|')
              : 'OK',

          category,
          year,
        };
      }
    );

  finalRecords.sort(
    (a, b) =>
      b.PDI - a.PDI
  );

  return finalRecords;
};