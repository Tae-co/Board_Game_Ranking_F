import api from '../axios';

export const getMember = (userId) => api.get(`/members/${userId}`).then(r => r.data);
export const getMemberStats = (userId) => api.get(`/members/${userId}/stats`).then(r => r.data);
export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);

export const updateNickname = (userId, nickname) =>
  api.patch(`/members/${userId}/nickname`, { nickname });
export const updateProfileImage = (userId, profileImage) =>
  api.patch(`/members/${userId}/profile-image`, { profileImage });
export const deleteMember = (userId) => api.delete(`/members/${userId}`);

// 시즌 기록 — 둘 다 마감된 시즌만 나온다 (진행 중인 시즌은 스냅샷이 없다).
export const getMemberSeasonHistory = (userId, roomId) =>
  api.get(`/members/${userId}/season-history?roomId=${roomId}`).then(r => r.data || []);
export const getMemberTrophies = (userId) =>
  api.get(`/members/${userId}/trophies`).then(r => r.data || []);
