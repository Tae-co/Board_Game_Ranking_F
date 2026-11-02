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

// 6i 게임방 관리
export const getAdminStoreRooms = (storeId) => api.get(`/admin/stores/${storeId}/rooms`).then(r => r.data);
export const setAdminStoreRoomClosed = (storeId, roomId, closed) =>
  api.put(`/admin/stores/${storeId}/rooms/${roomId}/closed`, { closed }).then(r => r.data);

// ── 매장 기기 (6g) · 매장 TV 화면 (6k) ──
export const getAdminStoreDevices = (storeId) => api.get(`/admin/stores/${storeId}/devices`).then(r => r.data);
export const revokeAdminStoreDevice = (storeId, deviceId) =>
  api.delete(`/admin/stores/${storeId}/devices/${deviceId}`).then(r => r.data);
export const rotateAdminStoreQrSecret = (storeId) => api.post(`/admin/stores/${storeId}/qr-secret`);
export const getAdminTvSetting = (storeId) => api.get(`/admin/stores/${storeId}/tv-setting`).then(r => r.data);
export const saveAdminTvSetting = (storeId, setting) =>
  api.put(`/admin/stores/${storeId}/tv-setting`, setting).then(r => r.data);

// ── 매장 시즌 · 신고(6b) · 통계 · 점수판 요청(6c) ──
export const getAdminStoreSeason = (storeId) => api.get(`/admin/stores/${storeId}/season`).then(r => r.data);
export const saveAdminStoreSeason = (storeId, form) => api.put(`/admin/stores/${storeId}/season`, form).then(r => r.data);
export const getAdminStoreReports = (storeId) => api.get(`/admin/stores/${storeId}/reports`).then(r => r.data);
// targetId가 없으면(탈퇴한 사람) 0
const reportPath = (storeId, gameId, targetId) => `/admin/stores/${storeId}/reports/${gameId}/${targetId ?? 0}`;
export const getAdminStoreReport = (storeId, gameId, targetId) => api.get(reportPath(storeId, gameId, targetId)).then(r => r.data);
export const resetAdminStoreRatings = (storeId, gameId, targetId, memberIds) =>
  api.post(`${reportPath(storeId, gameId, targetId)}/reset`, { memberIds }).then(r => r.data);
export const closeAdminStoreReport = (storeId, gameId, targetId) => api.post(`${reportPath(storeId, gameId, targetId)}/close`).then(r => r.data);
export const undoAdminStoreReset = (storeId, gameId, targetId) => api.post(`${reportPath(storeId, gameId, targetId)}/undo`).then(r => r.data);
export const getAdminStoreMonthlyReport = (storeId, month) =>
  api.get(`/admin/stores/${storeId}/report`, { params: month ? { month } : undefined }).then(r => r.data);
export const getAdminScoreRequests = () => api.get('/admin/score-requests').then(r => r.data);
export const setAdminScoreRequestStatus = (requestId, status) =>
  api.put(`/admin/score-requests/${requestId}/status`, { status }).then(r => r.data);
