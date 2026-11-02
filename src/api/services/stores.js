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
