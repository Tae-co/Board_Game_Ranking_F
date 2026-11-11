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

// 게임 이미지와 같은 어드민 업로드. Content-Type을 비워 브라우저가 multipart boundary를 넣게 한다
export const uploadAdminImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/admin/upload-image', fd, { headers: { 'Content-Type': undefined } }).then(r => r.data.url);
};
