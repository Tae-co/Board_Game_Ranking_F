import axios from 'axios';
import api from '../axios';

export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);
export const appleLogin = (identityToken, nickname) =>
  api.post('/auth/apple', { identityToken, nickname }).then(r => r.data);
// OAuth 콜백의 1회용 code를 토큰으로 교환한다 (#12). 응답: { token, refreshToken, userId, nickname, role }
// bare axios 사용: api 인스턴스의 401 refresh 인터셉터를 타지 않게 해, 중복/실패 교환이
// 로그인 세션을 지우는 것을 막는다.
export const exchangeOAuthCode = (code) =>
  axios.post(`${import.meta.env.VITE_API_URL}/auth/oauth/exchange`, { code }).then(r => r.data);
