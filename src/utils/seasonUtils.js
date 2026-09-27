import { REGION_TIMEZONE } from '../constants/regions';

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

/** '{month}월 시즌' 같은 템플릿 채우기. t()에 보간이 없어서 호출부가 직접 채운다. */
export const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

export const periodMonthLabel = (period, lang) => {
  const [year, month] = period.split('-');
  return lang === 'ko'
    ? `${Number(month)}월`
    : new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' });
};

// ── 시즌 경계 (리셋) ──
// 서버에 물어보지 않는다. 경계는 "커뮤니티 region 타임존의 매월 1일 00:00"으로 결정적이고,
// 프론트에 region 표가 이미 있다. 백엔드 Utils/RegionTimeZones.java와 같은 표이므로
// 한쪽을 고치면 반드시 양쪽을 고친다.
//
// 폴백이 Asia/Seoul인 것은 백엔드 RegionTimeZones.DEFAULT와 맞추려는 것이다. 브라우저
// 로컬 타임존으로 폴백하면 헤더가 서버 스냅샷과 다른 달을 가리킬 수 있다.
const zoneOf = (region) => REGION_TIMEZONE[region] || 'Asia/Seoul';

/** 해당 타임존의 지금 벽시계. 경계가 그 지역의 1일 00:00이라 오프셋 산수 없이 이것만으로 충분하다. */
const zonedNow = (region, now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneOf(region),
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(now).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24, // 자정을 24로 주는 엔진이 있다
  };
};

/** '2026-09' — 지금 진행 중인 시즌 키 */
export const currentSeasonKey = (region, now = new Date()) => {
  const { year, month } = zonedNow(region, now);
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * 다음 리셋 날짜 라벨 — 예고 배너가 "언제부터"를 말해야 하므로 날짜가 필요하다 (§11).
 * 다음 달 1일이고, 경계와 같은 타임존에서 계산한다.
 */
export const nextResetDateLabel = (region, lang, now = new Date()) => {
  const { year, month } = zonedNow(region, now);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  if (lang === 'ko') return `${next.month}월 1일`;
  return new Date(next.year, next.month - 1, 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * 진행 중인 시즌의 남은 기간과 진행률.
 * `daysLeft === 0`이면 오늘이 마감일이다 (다음 1일 00:00에 리셋된다).
 */
export const seasonProgress = (region, now = new Date()) => {
  const { year, month, day, hour } = zonedNow(region, now);
  const daysInMonth = new Date(year, month, 0).getDate();
  const elapsed = (day - 1) + hour / 24;
  return {
    seasonKey: `${year}-${String(month).padStart(2, '0')}`,
    month,
    daysLeft: daysInMonth - day,
    percent: Math.max(0, Math.min(100, Math.round((elapsed / daysInMonth) * 100))),
  };
};
