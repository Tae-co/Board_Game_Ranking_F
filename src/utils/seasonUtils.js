/** 지난달 결산을 로비에서 밀어주는 기간 (매월 1일~7일) */
const RECAP_WINDOW_DAYS = 7;

export const toPeriod = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * 월초이고 지난달 경기가 있으면 그 달의 period를, 아니면 null을 돌려준다.
 * 결산은 아무도 스스로 찾아보지 않아서, 나온 직후에만 로비에서 눈에 띄게 만든다.
 */
export const findFreshRecap = (periods, now = new Date()) => {
  if (now.getDate() > RECAP_WINDOW_DAYS) return null;
  const target = toPeriod(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  return periods.some((p) => p.period === target && p.matchCount > 0) ? target : null;
};

export const periodMonthLabel = (period, lang) => {
  const [year, month] = period.split('-');
  return lang === 'ko'
    ? `${Number(month)}월`
    : new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' });
};
