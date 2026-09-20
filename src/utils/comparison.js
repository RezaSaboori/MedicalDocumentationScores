const buildCompetitionRanks = (
  rows,
  scoreKey
) => {
  const ranked = (rows || [])
    .filter(
      (row) =>
        row &&
        row.name &&
        row[scoreKey] != null &&
        !Number.isNaN(
          Number(row[scoreKey])
        )
    )
    .map((row) => {
      const rawScore =
        Number(row[scoreKey]);

      return {
        name:
          String(row.name).trim(),
        rawScore,
        roundedScore:
          Math.ceil(rawScore),
      };
    })
    .sort(
      (a, b) =>
        b.roundedScore -
          a.roundedScore ||
        b.rawScore -
          a.rawScore ||
        a.name.localeCompare(
          b.name
        )
    );

  const ranks = new Map();

  let previousScore = null;
  let currentRank = 0;

  ranked.forEach(
    (row, index) => {
      if (
        previousScore === null ||
        row.roundedScore !==
          previousScore
      ) {
        currentRank =
          index + 1;

        previousScore =
          row.roundedScore;
      }

      ranks.set(
        row.name,
        currentRank
      );
    }
  );

  return ranks;
};

/**
 * Month-over-month comparison, ported from build_month_comparison() in dashboard.py.
 * Returns a Map keyed by trimmed physician name: { rankChange, scoreChange }.
 */
export const buildMonthComparison = (
  currentRows,
  previousRows,
  scoreKey
) => {
  const map = new Map();

  if (
    !Array.isArray(
      previousRows
    ) ||
    previousRows.length === 0
  ) {
    return map;
  }

  const clean = (rows) =>
    (rows || [])
      .filter(
        (row) =>
          row &&
          row.name &&
          row[scoreKey] != null &&
          !Number.isNaN(
            Number(
              row[scoreKey]
            )
          )
      )
      .map((row) => ({
        name:
          String(
            row.name
          ).trim(),
        score:
          Number(
            row[scoreKey]
          ),
      }));

  const current =
    clean(currentRows);

  const previous =
    clean(previousRows);

  if (
    current.length === 0 ||
    previous.length === 0
  ) {
    return map;
  }

  const currentRanks =
    buildCompetitionRanks(
      currentRows,
      scoreKey
    );

  const previousRanks =
    buildCompetitionRanks(
      previousRows,
      scoreKey
    );

  const previousScores =
    new Map(
      previous.map(
        (row) => [
          row.name,
          row.score,
        ]
      )
    );

  current.forEach((row) => {
    const currentRank =
      currentRanks.get(
        row.name
      );

    const previousRank =
      previousRanks.get(
        row.name
      );

    const previousScore =
      previousScores.get(
        row.name
      );

    map.set(row.name, {
      rankChange:
        previousRank != null &&
        currentRank != null
          ? previousRank -
            currentRank
          : null,

      scoreChange:
        previousScore != null
          ? row.score -
            previousScore
          : null,
    });
  });

  return map;
};

export const buildCurrentRanks = (
  rows,
  scoreKey
) =>
  buildCompetitionRanks(
    rows,
    scoreKey
  );

export const formatRankChange = (value) => {
  const v = Math.round(value);
  if (v > 0) return `+${Math.abs(v)}`;
  if (v < 0) return `-${Math.abs(v)}`;
  return '0';
};

export const formatScoreChange = (value) => {
  const v = Number(value);
  if (v > 0) return `+${Math.abs(v).toFixed(1)}`;
  if (v < 0) return `-${Math.abs(v).toFixed(1)}`;
  return '0.0';
};

export const changeColor = (value, positiveColor) => {
  if (value > 0) return positiveColor;
  if (value < 0) return '#C62828';
  return '#90A4AE';
};