import api from '../axios';

export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);
export const appleLogin = (identityToken, nickname) =>
  api.post('/auth/apple', { identityToken, nickname }).then(r => r.data);
