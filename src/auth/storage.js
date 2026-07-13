export const AUTH_CHANGED_EVENT = 'auth-changed';

const SESSION_EXPIRED_KEY = 'sessionExpired';

export const getStoredAuth = () => ({
  userId: localStorage.getItem('userId'),
  role: localStorage.getItem('role'),
  nickname: localStorage.getItem('nickname'),
  refreshToken: localStorage.getItem('refreshToken'),
});

export const getAuthUserId = () => localStorage.getItem('userId');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => {
  if (token) localStorage.setItem('refreshToken', token);
};
export const getNickname = () => localStorage.getItem('nickname') || '';
export const getRole = () => localStorage.getItem('role') || 'USER';
export const setNickname = (nickname) => {
  localStorage.setItem('nickname', nickname || '');
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const saveAuthSession = ({ userId, nickname, role, refreshToken }) => {
  localStorage.setItem('userId', String(userId));
  localStorage.setItem('nickname', nickname || '');
  localStorage.setItem('role', role || 'USER');

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  } else {
    localStorage.removeItem('refreshToken');
  }

  notifyAuthChanged();
};

export const clearAuthSession = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('nickname');
  localStorage.removeItem('role');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('phone');
  notifyAuthChanged();
};

/** JWT payload의 exp(초)를 ms로. 서명 검증이 아니라 만료 시각 조회용 (검증은 서버가 한다) */
const getTokenExpiresAt = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

/** refresh token이 만료됐으면 세션을 비우고 만료 플래그를 남긴다. 만료 처리했으면 true */
export const enforceSessionExpiry = () => {
  if (!getAuthUserId()) return false;

  const refreshToken = getRefreshToken();
  const expiresAt = refreshToken ? getTokenExpiresAt(refreshToken) : null;
  // 토큰이 없으면 만료로 간주. 파싱 실패 시엔 서버 판단(401)에 맡긴다
  const expired = !refreshToken || (expiresAt !== null && Date.now() >= expiresAt);
  if (!expired) return false;

  clearAuthSession();
  markSessionExpired();
  return true;
};

export const markSessionExpired = () => {
  localStorage.setItem(SESSION_EXPIRED_KEY, '1');
};

/** 만료 안내를 한 번만 보여주기 위해 읽으면서 지운다 */
export const consumeSessionExpired = () => {
  const expired = localStorage.getItem(SESSION_EXPIRED_KEY) === '1';
  localStorage.removeItem(SESSION_EXPIRED_KEY);
  return expired;
};
