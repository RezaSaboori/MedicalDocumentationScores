/**
 * Month-over-month comparison, ported from build_month_comparison() in dashboard.py.
 * Returns a Map keyed by trimmed physician name: { rankChange, scoreChange }.
 */
export const buildMonthComparison = (currentRows, previousRows, scoreKey) => {
  const map = new Map();
  if (!Array.isArray(previousRows) || previousRows.length === 0) return map;

  const clean = (rows) => (rows || [])
    .filter(r => r && r.name && r[scoreKey] != null && !Number.isNaN(Number(r[scoreKey])))
    .map(r => ({ name: String(r.name).trim(), score: Number(r[scoreKey]) }))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));

  const current = clean(currentRows);
  const previous = clean(previousRows);
  if (current.length === 0 || previous.length === 0) return map;

  const prevRank = new Map(previous.map((r, i) => [r.name, previous.length - i]));
  const prevScore = new Map(previous.map(r => [r.name, r.score]));

  current.forEach((r, i) => {
    const currentRank = current.length - i;
    const pRank = prevRank.get(r.name);
    const pScore = prevScore.get(r.name);
    map.set(r.name, {
      rankChange: pRank != null ? pRank - currentRank : null,
      scoreChange: pScore != null ? r.score - pScore : null,
    });
  });

  return map;
};

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