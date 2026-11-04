// 점수판 요청 상태 배지 색과 문구 키 (시안 2g·6c)
export const REQUEST_STATUSES = ['REVIEW', 'MAKING', 'ADDED', 'HOLD'];

export const REQUEST_PILL = {
  REVIEW: ['#F3F4F6', '#4B5563', 'requestReview'],
  MAKING: ['#FEF3C7', '#B45309', 'requestMaking'],
  ADDED: ['#E7F6EC', '#15803D', 'requestAdded'],
  HOLD: ['#FEE2E2', '#B91C1C', 'requestHold'],
};

export const SCORE_REQUESTS_KEY = ['adminScoreRequests'];

/** "홍대점 8 · 합정점 4" */
export const storeCounts = (r) => r.stores.map(s => `${s.name} ${s.count}`).join(' · ');
