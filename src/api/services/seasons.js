import api from '../axios';

export const getSeasonPeriods = (communityId) =>
  api.get(`/communities/${communityId}/seasons`).then(r => r.data);

export const getSeasonSummary = (communityId, period) =>
  api.get(`/communities/${communityId}/seasons/${period}`).then(r => r.data);

// 시즌제 예고 배너를 언제 내릴지 — 첫 롤오버가 일어나면 hasClosedSeason이 true가 된다.
export const getSeasonStatus = (communityId) =>
  api.get(`/communities/${communityId}/seasons/status`).then(r => r.data);
