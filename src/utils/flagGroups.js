import { BASE_FLAG_FA, BASE_FLAG_COLOR, FLAG_PRIORITY } from './constants';

const PAREN_LABEL = {
  ENGAGEMENT_TRAINING: 'کم‌حوصلگی',
};

const toFlags = (flagsStr) =>
  String(flagsStr || '')
    .split('|')
    .filter((f) => BASE_FLAG_FA[f]);

export const flagGroupLabel = (flagsStr) => {
  const flags = toFlags(flagsStr);
  const ordered = FLAG_PRIORITY.filter((f) => flags.includes(f));

  if (ordered.length === 0) return BASE_FLAG_FA.OK;
  if (ordered.length === 1) return BASE_FLAG_FA[ordered[0]];

  if (ordered.includes('LOW_DATA')) {
    const rest = ordered
      .filter((f) => f !== 'LOW_DATA' && f !== 'OK')
      .map((f) => PAREN_LABEL[f] || BASE_FLAG_FA[f]);

    if (rest.length === 0) return BASE_FLAG_FA.LOW_DATA;
    return `${BASE_FLAG_FA.LOW_DATA} (${rest.join(' و ')})`;
  }

  return ordered
    .filter((f) => f !== 'OK')
    .map((f) => BASE_FLAG_FA[f])
    .join(' ');
};

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export const flagGroupColor = (flagsStr) => {
  const flags = toFlags(flagsStr);
  const list = flags.length ? flags : ['OK'];
  const rgbs = list.map((f) => hexToRgb(BASE_FLAG_COLOR[f]));
  const avg = [0, 1, 2].map((i) => rgbs.reduce((s, c) => s + c[i], 0) / rgbs.length);
  return rgbToHex(avg);
};