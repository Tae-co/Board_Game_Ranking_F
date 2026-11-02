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

// ── 매장 (/api/admin/stores/**) ──

export const getAdminStores = () => api.get('/admin/stores').then(r => r.data);
export const createAdminStore = (payload) => api.post('/admin/stores', payload).then(r => r.data);
export const updateAdminStore = (storeId, payload) =>
  api.put(`/admin/stores/${storeId}`, payload).then(r => r.data);
export const closeAdminStore = (storeId) => api.post(`/admin/stores/${storeId}/close`).then(r => r.data);
export const getStaffCandidates = () => api.get('/admin/stores/staff-candidates').then(r => r.data);
export const assignStoreStaff = (storeId, memberId) =>
  api.put(`/admin/stores/${storeId}/staff/${memberId}`).then(r => r.data);
export const unassignStoreStaff = (storeId, memberId) =>
  api.delete(`/admin/stores/${storeId}/staff/${memberId}`).then(r => r.data);

// 게임 이미지와 같은 어드민 업로드. Content-Type을 비워 브라우저가 multipart boundary를 넣게 한다
export const uploadAdminImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/admin/upload-image', fd, { headers: { 'Content-Type': undefined } }).then(r => r.data.url);
};
