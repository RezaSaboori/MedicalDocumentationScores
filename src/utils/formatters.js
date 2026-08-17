export const formatPercent = (value, digits = 1) =>
  `${(value * 100).toFixed(digits)}٪`;

export const formatNumber = (value, digits = 0) =>
  Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });

export const pdiGradientColor = (value, threshold) => {
  value = Math.min(Math.max(value, 0.0), 100.0);
  threshold = Math.min(Math.max(threshold, 1e-9), 100.0 - 1e-9);

  const interpStops = (val, x0, x1, stops) => {
    const span = Math.max(x1 - x0, 1e-9);
    const t = Math.min(Math.max((val - x0) / span, 0.0), 1.0);
    const n = stops.length - 1;
    const seg = Math.min(Math.floor(t * n), n - 1);
    const segT = (t * n) - seg;
    const c0 = stops[seg];
    const c1 = stops[seg + 1];
    const r = Math.round(c0[0] + (c1[0] - c0[0]) * segT);
    const g = Math.round(c0[1] + (c1[1] - c0[1]) * segT);
    const b = Math.round(c0[2] + (c1[2] - c0[2]) * segT);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const belowStops = [
    [0x6A, 0x1B, 0x9A], [0xC6, 0x28, 0x28], [0xE6, 0x51, 0x00], [0xF9, 0xA8, 0x25],
  ];
  const aboveStops = [
    [0x80, 0x8B, 0x1D], [0x7C, 0xB3, 0x42], [0x1B, 0x5E, 0x20],
  ];

  return value >= threshold 
    ? interpStops(value, threshold, 100.0, aboveStops) 
    : interpStops(value, 0.0, threshold, belowStops);
};