/**
 * 페이크 도어 페이월의 게이트. 백엔드 GateKey enum과 이름이 일치해야 한다.
 *
 * 유료는 전부 규모 한도다. 랭킹·기록·점수판은 잠그지 않는다 — 그건 훅이자 해자다.
 * 잠기는 건 모임이 커졌을 때 운영자가 혼자 감당하는 쪽뿐이고,
 * 전부 세션 밖에서 운영자 단독으로 하는 행동이다.
 */
export const GATE = {
  MEMBER_LIMIT: 'MEMBER_LIMIT',
  ROOM_LIMIT: 'ROOM_LIMIT',
  SECOND_COMMUNITY: 'SECOND_COMMUNITY',
  CO_ADMIN: 'CO_ADMIN',
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
};
