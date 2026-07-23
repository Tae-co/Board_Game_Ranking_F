import api from '../axios';

export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);
export const kakaoLogin = (kakaoAccessToken) =>
  api.post('/auth/kakao', { kakaoAccessToken }).then(r => r.data);
export const adminLogin = (username, password) =>
  api.post('/auth/admin-login', { username, password }).then(r => r.data);
export const appleLogin = (identityToken, nickname) =>
  api.post('/auth/apple', { identityToken, nickname }).then(r => r.data);
