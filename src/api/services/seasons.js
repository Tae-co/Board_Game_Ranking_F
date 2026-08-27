import api from '../axios';

export const getSeasonPeriods = (communityId) =>
  api.get(`/communities/${communityId}/seasons`).then(r => r.data);

export const getSeasonSummary = (communityId, period) =>
  api.get(`/communities/${communityId}/seasons/${period}`).then(r => r.data);
