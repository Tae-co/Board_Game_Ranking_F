/** 대회 일시: "11월 28일 (토) 오후 1시" / "Sat, Nov 28, 1:00 PM" (기기 시간대 — 매장과 같은 지역에서 본다) */
export const contestWhen = (iso, lang) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (lang !== 'ko') {
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  const day = '일월화수목금토'[d.getDay()];
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day}) ${ampm} ${h12}시${m ? ` ${m}분` : ''}`;
};

/** "2026-11-01" → "11/1" */
export const shortDate = (ymd) => {
  if (!ymd) return '';
  const [, m, d] = ymd.split('-');
  return `${Number(m)}/${Number(d)}`;
};

/** 순위 점수 = 그 판 인원 - 순위 + 1 (4인 4/3/2/1, 3인 3/2/1) */
export const placementPoints = (players, placement) => Math.max(0, players - placement + 1);

export const contestKey = (contestId) => ['store', 'contest', Number(contestId)];

export const CONTEST_PATH = (storeId, contestId) => `/store/${storeId}/contest/${contestId}`;

/** 배지 색 (시안 5a·5b·5d) */
export const PILL = {
  orange: ['#FFF1E6', '#B4500A'],
  green: ['#E3F2E9', '#2F6B4C'],
  gray: ['#F3F4F6', '#4B5563'],
  red: ['#FEE2E2', '#B91C1C'],
  blue: ['#E0F2FE', '#075985'],
};

export const pill = ([bg, color]) => ({
  alignSelf: 'flex-start', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
  backgroundColor: bg, color, flexShrink: 0,
});
