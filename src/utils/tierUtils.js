import { TIERS } from '../components/TierBadge';

export const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
};

export const getTierFromRating = (rating = 1500) => {
  if (rating >= 2600) return { ...TIERS.diamond, label: 'DIAMOND' };
  if (rating >= 2300) return { ...TIERS.platinum, label: 'PLATINUM' };
  if (rating >= 2000) return { ...TIERS.gold, label: 'GOLD' };
  if (rating >= 1700) return { ...TIERS.silver, label: 'SILVER' };
  return { ...TIERS.bronze, label: 'BRONZE' };
};

export const getTierBg = (label) => {
  switch (label) {
    case 'DIAMOND': return { bg: '#EEF2FF', text: '#3730A3' };
    case 'PLATINUM': return { bg: '#F0FDFA', text: '#0F766E' };
    case 'GOLD': return { bg: '#FFFBEB', text: '#B45309' };
    case 'SILVER': return { bg: '#F8FAFC', text: '#475569' };
    default: return { bg: '#FFF7ED', text: '#9A3412' };
  }
};
