export const formatPercent = (value, digits = 1) =>
  `${(value * 100).toFixed(digits)}٪`;

export const formatNumber = (value, digits = 0) =>
  Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });