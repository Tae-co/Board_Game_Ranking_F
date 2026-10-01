import { REGION_TIMEZONE } from '../constants/regions';

/** '{n}판' 같은 템플릿 채우기. t()에 보간이 없어서 호출부가 직접 채운다. */
export const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

// ── 방별 시즌 (plan-season-reset §22) ──
// 시즌은 서버가 준다: { seasonNumber, name, startDate, endDate, startAt, endAt }.
// startAt·endAt은 매치 playedAt과 같은 "UTC + Z" 문자열이고 endAt은 배타적(종료일 다음 날 00:00)이다.
// 날짜(startDate·endDate)는 커뮤니티 region 타임존 기준이다.
//
// 폴백이 Asia/Seoul인 것은 백엔드 RegionTimeZones.DEFAULT와 맞추려는 것이다. 브라우저
// 로컬 타임존으로 폴백하면 "오늘"이 서버와 다른 날을 가리킬 수 있다.
const zoneOf = (region) => REGION_TIMEZONE[region] || 'Asia/Seoul';

/** 그 지역의 오늘 'YYYY-MM-DD'. 종료일 입력의 최소값(내일)을 정할 때도 쓴다. */
export const todayInRegion = (region, now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: zoneOf(region), year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(now);

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' 두 개의 날짜 차이(일). 둘 다 같은 달력의 날짜라 UTC로 읽어도 차이는 정확하다. */
const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

export const addDays = (date, days) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

/** 종료일로 고를 수 있는 가장 이른 날 = 내일. 서버도 같은 규칙으로 막는다. */
export const minEndDate = (region) => addDays(todayInRegion(region), 1);

/** 백엔드 RoomSeason.MAX_NAME_LENGTH와 같다. */
export const SEASON_NAME_MAX = 40;

/** 저장 버튼을 켤지 — 이름이 있고 종료일이 내일 이후 */
export const isSeasonInputValid = (name, endDate, region) =>
  !!name.trim() && !!endDate && endDate >= minEndDate(region);

/** 새 방의 기본 종료일 = 오늘부터 4주 (오늘 포함 28일). */
export const defaultEndDate = (region) => addDays(todayInRegion(region), 27);

/** 이름이 비어 있으면(자동 연장된 시즌) "시즌 N" */
export const seasonLabel = (season, t) =>
  season?.name || fill(t('season', 'seasonNumber'), { n: season?.seasonNumber ?? 1 });

/** '10.28' / 'Oct 28' */
export const shortDateLabel = (date, lang) => {
  const [, month, day] = date.split('-').map(Number);
  if (lang === 'ko') return `${month}.${day}`;
  return new Date(Date.UTC(2000, month - 1, day))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/**
 * 진행 중 시즌의 남은 기간과 진행률.
 * `daysLeft === 0`이면 오늘이 종료일이다 (내일 00:00에 다음 시즌으로 넘어간다).
 */
export const seasonProgress = (season, region, now = new Date()) => {
  const daysLeft = Math.max(0, daysBetween(todayInRegion(region, now), season.endDate));
  const start = Date.parse(season.startAt);
  const end = Date.parse(season.endAt);
  const percent = end > start ? Math.round(((now.getTime() - start) / (end - start)) * 100) : 100;
  return { daysLeft, percent: Math.max(0, Math.min(100, percent)) };
};

/**
 * 이 경기가 진행 중 시즌에 속하는가. 첫 시즌은 시즌제 도입 전 경기까지 덮으므로 하한이 없다
 * (백엔드 재계산 RoomSeasonService.currentSeasonStartUtc와 같은 규칙).
 */
export const isInSeason = (playedAt, season) =>
  !!season && (season.seasonNumber === 1 || Date.parse(playedAt) >= Date.parse(season.startAt));
