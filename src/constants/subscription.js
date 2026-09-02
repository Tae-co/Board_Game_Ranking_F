/**
 * 모임장 Pro 구독. **결제 로직은 없다 — UI 프로토타입이다.**
 *
 * 가격은 아직 검증 전이다. 문서가 검증된 구간으로 본 소모임 15,500원 ~
 * Meetup 4만원 사이에서 9,900원을 골랐다: 이 앱은 모집 기능이 없어 기능
 * 범위가 소모임보다 좁고, 심리적 1만원선 아래다. 바꿀 땐 이 파일만 고친다.
 */

export const BILLING = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
};

export const PLANS = {
  [BILLING.MONTHLY]: { id: BILLING.MONTHLY, price: 9900, months: 1 },
  // 9,900 × 12 = 118,800이므로 99,000은 정확히 2개월치가 빠진 금액이다
  [BILLING.YEARLY]: { id: BILLING.YEARLY, price: 99000, months: 12, perMonth: 8250 },
};

/**
 * 페이월 시트와 구독 안내 페이지가 **같은 목록**을 쓴다. 두 곳에 따로 두면
 * 한쪽만 고쳐져서 어긋난다. gate가 null인 둘은 아직 코드가 0줄인 항목으로,
 * 어느 쪽에 손이 가는지 재는 미끼다 (문서 A-8).
 */
export const PRO_FEATURES = [
  { key: 'unlimitedMembers', gate: 'MEMBER_LIMIT' },
  { key: 'multipleRooms', gate: 'ROOM_LIMIT' },
  { key: 'multipleCommunities', gate: 'SECOND_COMMUNITY' },
  { key: 'coAdmin', gate: 'CO_ADMIN' },
  { key: 'customSheets', gate: 'CUSTOM_SHEET' },
  { key: 'attendance', gate: null },
  { key: 'dues', gate: null },
];

export const formatPrice = (amount, lang) =>
  lang === 'ko'
    ? `${amount.toLocaleString('ko-KR')}원`
    : `₩${amount.toLocaleString('en-US')}`;

export const formatDate = (date, lang) =>
  lang === 'ko'
    ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/** 월 더하기. setMonth는 1/31 + 1개월을 3/3으로 넘겨버려서 말일을 직접 클램프한다. */
export const addMonths = (iso, months) => {
  const d = new Date(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};
