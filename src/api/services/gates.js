import api from '../axios';

// 측정용이라 사용자 흐름을 막으면 안 된다 — 실패해도 조용히 넘어간다.
export const recordGateEvent = (payload) =>
  api.post('/gates/events', payload).catch(() => {});
