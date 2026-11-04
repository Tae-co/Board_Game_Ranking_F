import { fmt } from '../store/fmt';

/**
 * 매장 기기 화면(4·4c·4e·4f·4h·4i·4j) 팔레트. 앱 테마와 상관없이 흰 화면 하나라 테마 변수 대신 시안 색을 그대로 쓴다.
 */
export const D = {
  bg: '#FFFFFF',
  card: '#F8F8FD',
  cardAlt: '#F8F8FD',
  border: '#E5E7EB',
  stepBg: '#ECEBFF',
  stepText: '#3730A3',
  pairStepBg: '#EEEEF8',
  text: '#111827',
  sub: '#6B7280',
  soft: '#4B5563',
  accent: '#4F46E5',
  accentText: '#4F46E5',
  accentSoft: '#3730A3',
  gold: '#B45309',
  silver: '#374151',
  up: '#15803D',
  button: '#4F46E5',
  foot: '#6B7280',
  dot: '#D1D5DB',
};

export const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/** 9분 24초 / 40초 */
export const minSec = (ms, t) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? fmt(t('store', 'minSec'), { m, s }) : fmt(t('store', 'secOnly'), { s });
};

/** 1시간 0분 / 40분 (QR 남은 시간, 분 단위 올림) */
export const hourMin = (ms, t) => {
  const total = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? fmt(t('store', 'hourMin'), { h, m }) : fmt(t('store', 'minOnly'), { m });
};

/** 15:42 (기기 기준 시각) */
export const clock = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
