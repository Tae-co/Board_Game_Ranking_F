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
