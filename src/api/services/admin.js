import api, { ensureToken } from '../axios';

export const getAdminGames = async () => {
  await ensureToken();
  return api.get('/admin/games').then(r => r.data || []);
};

export const getAdminMembers = () => api.get('/admin/members').then(r => r.data);

export const createAdminGame = (payload) => api.post('/admin/games', payload).then(r => r.data);
export const updateAdminGame = (gameId, payload) =>
  api.put(`/admin/games/${gameId}`, payload).then(r => r.data);
export const deleteAdminGame = (gameId) => api.delete(`/admin/games/${gameId}`);
