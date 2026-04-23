export const AUTH_CHANGED_EVENT = 'auth-changed';

export const getStoredAuth = () => ({
  userId: localStorage.getItem('userId'),
  role: localStorage.getItem('role'),
  nickname: localStorage.getItem('nickname'),
  refreshToken: localStorage.getItem('refreshToken'),
});

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
