import { fmt } from './fmt';

// 월간 리포트 heat 행 순서 (월~일)
export const DAY_KEYS = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];

/** 가장 붐빈 칸 둘: "토 20–23시 · 금 17–20시" (6 통계 피크 시간) */
export const peakText = (report, t) => {
  const cells = [];
  report.heat.forEach((row, d) => row.forEach((n, b) => { if (n > 0) cells.push({ d, b, n }); }));
  cells.sort((a, b) => b.n - a.n);
  return cells.slice(0, 2).map(c => {
    const from = report.heatHours[c.b];
    return fmt(t('store', 'peakCell'), { day: t('store', DAY_KEYS[c.d]), from, to: (from + 3) % 24 });
  }).join(' · ');
};
