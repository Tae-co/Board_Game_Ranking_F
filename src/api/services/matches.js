import api from '../axios';

export const createMatch = (payload) => api.post('/matches', payload).then(r => r.data);
export const updateMatch = (matchId, payload) =>
  api.put(`/matches/${matchId}`, payload).then(r => r.data);
export const deleteMatch = (matchId) =>
  api.delete(`/matches/${matchId}`);
