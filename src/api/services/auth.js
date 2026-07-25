import api from '../axios';

export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);
export const appleLogin = (identityToken, nickname) =>
  api.post('/auth/apple', { identityToken, nickname }).then(r => r.data);
// OAuth 콜백의 1회용 code를 토큰으로 교환한다 (#12). 응답: { token, refreshToken, userId, nickname, role }
export const exchangeOAuthCode = (code) =>
  api.post('/auth/oauth/exchange', { code }).then(r => r.data);
