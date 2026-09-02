/**
 * 페이크 도어 페이월의 게이트. 백엔드 GateKey enum과 이름이 일치해야 한다.
 *
 * 유료는 전부 규모 한도다 — 기능 자체를 잠그는 게 아니라 개수를 잠근다.
 * 랭킹·기록·점수 입력은 여전히 무제한 무료다. 그건 훅이자 해자라 잠그면 제품이 죽는다.
 * 잠기는 건 전부 세션 밖에서 운영자가 혼자 하는 행동이다.
 *
 * 커스텀 점수판은 2026-09-02에 "전부 무료"에서 3개 한도로 되돌아왔다.
 */
export const GATE = {
  MEMBER_LIMIT: 'MEMBER_LIMIT',
  ROOM_LIMIT: 'ROOM_LIMIT',
  SECOND_COMMUNITY: 'SECOND_COMMUNITY',
  CO_ADMIN: 'CO_ADMIN',
  CUSTOM_SHEET: 'CUSTOM_SHEET',
};

export const GATE_ACTION = {
  HIT: 'HIT',
  INTEREST: 'INTEREST',
};

/** 무료 한도. 8명인 이유: 대부분의 보드게임이 4~6인 상한이라 한 테이블의 경계와 일치한다. */
export const FREE_LIMITS = {
  members: 8,
  rooms: 3,
  communities: 1,
  // 커스텀 점수판. 2026-09-02 창업자 결정으로 "전부 무료"에서 3개로 되돌림.
  customSheets: 3,
};
