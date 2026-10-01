import api from '../axios';

// 커뮤니티 현황 — 최근 30일. 서버가 조회할 때마다 계산한다 (plan-season-reset §22).
export const getCommunityStatus = (communityId) =>
  api.get(`/communities/${communityId}/status`).then(r => r.data);
