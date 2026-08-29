/**
 * 페이크 도어 페이월의 게이트. 백엔드 GateKey enum과 이름이 일치해야 한다.
 *
 * 무료/유료 경계는 plan-monetization.md의 표를 따른다. 핵심 루프
 * (사람 고르기 → 게임 → 점수 입력 → 랭킹 보기)에는 게이트가 하나도 없다.
 * 잠기는 건 전부 운영자가 혼자 조용히 하는 행동뿐이다.
 */
export const GATE = {
  MEMBER_LIMIT: 'MEMBER_LIMIT',
  SECOND_COMMUNITY: 'SECOND_COMMUNITY',
  CO_ADMIN: 'CO_ADMIN',
  CUSTOM_SHEET_LIMIT: 'CUSTOM_SHEET_LIMIT',
  SEASON_RECAP_SHARE: 'SEASON_RECAP_SHARE',
  RECORD_EXPORT: 'RECORD_EXPORT',
};

export const GATE_ACTION = {
  HIT: 'HIT',
  INTEREST: 'INTEREST',
};

/** 무료 한도. 8명인 이유: 대부분의 보드게임이 4~6인 상한이라 한 테이블의 경계와 일치한다. */
export const FREE_LIMITS = {
  members: 8,
  communities: 1,
  customSheets: 3,
};
