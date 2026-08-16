import { BASE_FLAG_COLOR, BASE_FLAG_FA, FLAG_PRIORITY } from './constants';

// Exact combo names ported from dashboard.py (keys = sorted flags joined by "|")
export const COMBO_NAME_FA = {
  INTEGRITY_AUDIT: 'مشکوک به داده کاذب',
  ENGAGEMENT_TRAINING: 'کم‌حوصله',
  EXEMPLAR: 'باحوصله',
  OK: 'عادی',
  LOW_DATA: 'فاقد ویزیت کافی',
  'ENGAGEMENT_TRAINING|INTEGRITY_AUDIT': 'مشکوک به داده کاذبِ کم‌حوصله',
  'ENGAGEMENT_TRAINING|EXEMPLAR': 'باحوصلهٔ پرمشغله',
  'INTEGRITY_AUDIT|LOW_DATA': 'فاقد ویزیت کافی (مشکوک به داده کاذب)',
  'ENGAGEMENT_TRAINING|LOW_DATA': 'فاقد ویزیت کافی (مشکوک به کم‌حوصلگی)',
  'ENGAGEMENT_TRAINING|INTEGRITY_AUDIT|LOW_DATA': 'فاقد ویزیت کافی (مشکوک به داده کاذب و کم‌حوصلگی)',
};

const comboKey = (flags) => [...flags].sort().join('|');

export const comboLabel = (flags) =>
  COMBO_NAME_FA[comboKey(flags)] ??
  FLAG_PRIORITY.filter((f) => flags.includes(f))
    .map((f) => BASE_FLAG_FA[f])
    .join(' + ');

export const blendHex = (hexColors) => {
  const rgb = hexColors.map((h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]);
  const channel = (i) =>
    Math.round(rgb.reduce((sum, c) => sum + c[i], 0) / rgb.length);
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`;
};

export const comboColor = (flags) => {
  const colors = flags
    .filter((f) => BASE_FLAG_COLOR[f])
    .sort()
    .map((f) => BASE_FLAG_COLOR[f]);
  if (colors.length === 0) return '#1f77b4';
  return colors.length === 1 ? colors[0] : blendHex(colors);
};

export const GROUP_COLOR_MAP = Object.fromEntries(
  Object.keys(COMBO_NAME_FA).map((key) => [
    COMBO_NAME_FA[key],
    comboColor(key.split('|')),
  ]),
);