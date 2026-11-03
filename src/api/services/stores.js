import axios from 'axios';
import api, { getAccessToken } from '../axios';

// 매장 API 오류는 { message, code }로 온다. 화면은 문구가 아니라 code로 나눈다 (plan-store-impl-p1 §3.7).
export const storeErrorCode = (error) => error?.response?.data?.code ?? null;

/** QR을 찍은 순간 확인. 로그인 전에도 부른다 → { result, ticket, store } */
export const scanStore = (storeId, token) =>
  api.post(`/stores/${storeId}/scan`, { token }).then(r => r.data);

export const getStores = (q) =>
  api.get('/stores', { params: q ? { q } : undefined }).then(r => r.data);
export const getMyStores = () => api.get('/stores/mine').then(r => r.data);
export const getStoreHome = (storeId) => api.get(`/stores/${storeId}/home`).then(r => r.data);
export const getStoreEvents = (storeId) => api.get(`/stores/${storeId}/events`).then(r => r.data);

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

// ── 3단계: 매장 기기 ──

// STAFF 폰 2l (로그인 STAFF)
export const getStoreDevices = (storeId) => api.get(`/stores/${storeId}/devices`).then(r => r.data);
export const registerStoreDevice = (storeId, { code, kind, name }) =>
  api.post(`/stores/${storeId}/devices`, { code, kind, name }).then(r => r.data);
export const revokeStoreDevice = (storeId, deviceId) => api.delete(`/stores/${storeId}/devices/${deviceId}`).then(r => r.data);

// 기기 쪽(4j·4·4f)은 사람 로그인이 없다. 공용 api 인스턴스는 401에 refresh·로그아웃을 하므로 따로 만든다
const deviceApi = axios.create({ baseURL: import.meta.env.VITE_API_URL, headers: { 'Content-Type': 'application/json' } });

/** 4j 숫자 받기 → { code, nonce, expiresAt, serverNow } */
export const getDevicePairCode = () => deviceApi.post('/stores/device/pair-code').then(r => r.data);
/** 4j 폴링 → { status: WAITING | CLAIMED | EXPIRED, deviceToken, kind } */
export const getDevicePairStatus = (nonce) => deviceApi.get(`/stores/device/pair-code/${nonce}`).then(r => r.data);
/** 4·4f 기기 화면 데이터. 해제된 기기면 401 DEVICE_TOKEN_INVALID */
export const getDeviceDisplay = (token) =>
  deviceApi.get('/stores/device/display', { headers: { 'X-Device-Token': token } }).then(r => r.data);

// ── 4단계: 시즌 · 신고 · 프로필 · 리포트 · 점수판 요청 ──

export const getStoreRoomSeasons = (storeId, roomId) => api.get(`/stores/${storeId}/rooms/${roomId}/seasons`).then(r => r.data);
/** reason: NOT_PLAYED / THROWING / OTHER */
export const reportStoreMatch = (matchId, reason, memo) => api.post(`/stores/matches/${matchId}/report`, { reason, memo });
export const markStoreResetSeen = (storeId) => api.post(`/stores/${storeId}/reset-notice/seen`);
export const getStoreProfile = () => api.get('/stores/profile').then(r => r.data);
/** STAFF 월간 리포트. month "yyyy-MM" (없으면 이번 달) */
export const getStoreMonthlyReport = (storeId, month) =>
  api.get(`/stores/${storeId}/report`, { params: month ? { month } : undefined }).then(r => r.data);

export const getScoreRequests = () => api.get('/stores/score-requests').then(r => r.data);
export const requestScoreSheet = (payload) => api.post('/stores/score-requests', payload).then(r => r.data);
export const voteScoreRequest = (requestId, storeId) =>
  api.post(`/stores/score-requests/${requestId}/vote`, null, { params: storeId ? { storeId } : undefined }).then(r => r.data);

// 점수표·룰북 사진. 공용 api 인스턴스는 Content-Type을 JSON으로 고정해서 FormData는 fetch로 (games.js uploadGameImage와 같은 이유)
export const uploadScoreRequestImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = getAccessToken();
  const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  return (await res.json()).url;
};

// ── 5단계: 하루 대회 ──

export const getStoreContest = (storeId, contestId) => api.get(`/stores/${storeId}/contests/${contestId}`).then(r => r.data);
export const applyStoreContest = (storeId, contestId) => api.post(`/stores/${storeId}/contests/${contestId}/entry`).then(r => r.data);
export const withdrawStoreContest = (storeId, contestId) => api.delete(`/stores/${storeId}/contests/${contestId}/entry`).then(r => r.data);
// STAFF (5e·5c)
export const setContestArrived = (storeId, contestId, memberId, arrived) =>
  api.put(`/stores/${storeId}/contests/${contestId}/arrivals/${memberId}`, { arrived }).then(r => r.data);
export const startStoreContest = (storeId, contestId, recorderMemberId) =>
  api.post(`/stores/${storeId}/contests/${contestId}/start`, { recorderMemberId }).then(r => r.data);
export const cancelStoreContest = (storeId, contestId) => api.post(`/stores/${storeId}/contests/${contestId}/cancel`).then(r => r.data);
export const approveContestMatch = (storeId, contestId, matchId) =>
  api.post(`/stores/${storeId}/contests/${contestId}/matches/${matchId}/approve`).then(r => r.data);
export const sendBackContestMatch = (storeId, contestId, matchId) =>
  api.post(`/stores/${storeId}/contests/${contestId}/matches/${matchId}/send-back`).then(r => r.data);
