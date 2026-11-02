import api from '../axios';

// 매장 API 오류는 { message, code }로 온다. 화면은 문구가 아니라 code로 나눈다 (plan-store-impl-p1 §3.7).
export const storeErrorCode = (error) => error?.response?.data?.code ?? null;

/** QR을 찍은 순간 확인. 로그인 전에도 부른다 → { result, ticket, store } */
export const scanStore = (storeId, token) =>
  api.post(`/stores/${storeId}/scan`, { token }).then(r => r.data);

export const getStores = (q) =>
  api.get('/stores', { params: q ? { q } : undefined }).then(r => r.data);
export const getMyStores = () => api.get('/stores/mine').then(r => r.data);
export const getStoreHome = (storeId) => api.get(`/stores/${storeId}/home`).then(r => r.data);

export const joinStore = (storeId, ticket, consentVersion) =>
  api.post(`/stores/${storeId}/join`, { ticket, consentVersion }).then(r => r.data);
export const checkInStore = (storeId, ticket) =>
  api.post(`/stores/${storeId}/checkin`, { ticket }).then(r => r.data);
export const leaveStore = (storeId) => api.delete(`/stores/${storeId}/membership`);

export const getCheckinQr = (storeId) => api.get(`/stores/${storeId}/checkin-qr`).then(r => r.data);

// ── 2단계: 오늘의 그룹 · 매장 게임방 · 판 ──

/** 내 그룹. 없으면 null (서버 204) */
export const getCurrentParty = () => api.get('/stores/parties/current').then(r => (r.status === 204 ? null : r.data));
export const createParty = (storeId) => api.post(`/stores/${storeId}/parties`).then(r => r.data);
export const joinParty = (storeId, code, move = false) =>
  api.post(`/stores/${storeId}/parties/join`, { code, move }).then(r => r.data);
export const leaveParty = () => api.post('/stores/parties/leave');
export const disbandParty = () => api.post('/stores/parties/disband');
export const kickPartyMember = (memberId) => api.post(`/stores/parties/members/${memberId}/kick`).then(r => r.data);
export const handOverRecorder = (memberId) => api.post(`/stores/parties/recorder/${memberId}`).then(r => r.data);

export const getStoreGames = (storeId) => api.get(`/stores/${storeId}/games`).then(r => r.data);
export const getStoreRoom = (storeId, roomId) => api.get(`/stores/${storeId}/rooms/${roomId}`).then(r => r.data);
export const getStoreRanking = (storeId, roomId) => api.get(`/stores/${storeId}/rooms/${roomId}/ranking`).then(r => r.data);
export const getStoreRoomMatches = (storeId, roomId) => api.get(`/stores/${storeId}/rooms/${roomId}/matches`).then(r => r.data);
export const startStoreMatch = (storeId, roomId) => api.post(`/stores/${storeId}/rooms/${roomId}/matches`).then(r => r.data);

export const getStoreMatch = (matchId) => api.get(`/stores/matches/${matchId}`).then(r => r.data);
export const saveStoreMatchDraft = (matchId, draftJson) =>
  api.put(`/stores/matches/${matchId}/draft`, { draftJson }).then(r => r.data);
export const submitStoreMatch = (matchId, participants) =>
  api.post(`/stores/matches/${matchId}/submit`, { participants }).then(r => r.data);
export const confirmStoreMatch = (matchId) => api.post(`/stores/matches/${matchId}/confirm`).then(r => r.data);
export const disputeStoreMatch = (matchId) => api.post(`/stores/matches/${matchId}/dispute`).then(r => r.data);
export const reopenStoreMatch = (matchId) => api.post(`/stores/matches/${matchId}/reopen`).then(r => r.data);
export const cancelStoreMatch = (matchId) => api.post(`/stores/matches/${matchId}/cancel`).then(r => r.data);
