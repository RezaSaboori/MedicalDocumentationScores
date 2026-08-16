import { comboLabel } from './flags';

// Deterministic PRNG so the mock dashboard is stable between reloads
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FIRST_NAMES = ['محمد', 'سارا', 'علی', 'نگار', 'حسین', 'مریم', 'رضا', 'لیلا', 'امیر', 'نسترن', 'مهدی', 'شیوا', 'کاظم', 'الهام', 'بابک', 'آیدا', 'فرهاد', 'غزل', 'آرش', 'مینا'];
const LAST_NAMES = ['احمدی', 'رضایی', 'کریمی', 'موسوی', 'جعفری', 'صادقی', 'نادری', 'شفیعی', 'قاسمی', 'هاشمی', 'رستمی', 'کاظمی', 'بهرامی', 'یزدانی', 'فرهادی', 'امینی', 'خسروی', 'دانشور', 'صبوری', 'توکلی'];

export const generateMockPhysicians = (count = 64) => {
  const rand = mulberry32(20260816);

  return Array.from({ length: count }, (_, i) => {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`;

    const rhoZ = Math.min(0.95, Math.pow(rand(), 1.6) * 0.9);
    const rhoF = Math.min(0.5, Math.pow(rand(), 2.2) * 0.45);
    const V = Math.max(12, Math.round(Math.exp(3.2 + rand() * 3.4)));
    const N = Math.max(5, Math.round(V * (0.4 + rand() * 0.5)));

    const flags = [];
    if (rhoF > 0.05) flags.push('INTEGRITY_AUDIT');
    if (rhoZ > 0.4) flags.push('ENGAGEMENT_TRAINING');
    if (V < 40) flags.push('LOW_DATA');
    if (flags.length === 0) flags.push(rand() > 0.72 ? 'EXEMPLAR' : 'OK');

    const qualityBase = 0.9 - rhoZ * 0.55 - rhoF * 1.1 + rand() * 0.15;
    const WQS_adj = Math.min(1, Math.max(0.05, qualityBase));
    const LAQ = (WQS_adj - 0.55) * 1.6 + (rand() - 0.5) * 0.3;
    const PDI = Math.min(100, Math.max(0, WQS_adj * 90 + (1 - rhoF) * 10));

    return {
      name,
      V,
      N,
      rho_Z: Number(rhoZ.toFixed(3)),
      rho_F: Number(rhoF.toFixed(3)),
      WQS_adj: Number(WQS_adj.toFixed(3)),
      LAQ: Number(LAQ.toFixed(3)),
      PDI: Number(PDI.toFixed(1)),
      flags,
      group_fa: comboLabel(flags),
      year: 1403,
    };
  });
};