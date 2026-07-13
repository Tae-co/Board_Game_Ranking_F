import axios from 'axios';
import { clearAuthSession, getRefreshToken, markSessionExpired, setRefreshToken } from '../auth/storage';

let accessToken = null;
let _refreshPromise = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;

// refresh 응답에는 새 refresh token도 담겨 온다(rotation) — 저장해야 만료 시각이 연장된다
const applyRefreshedTokens = (data) => {
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
};

// 세션이 끝난 경우에만 로그아웃 처리. 네트워크 오류로는 로그아웃시키지 않는다
const handleRefreshFailure = (error) => {
  const status = error?.response?.status;
  if (status !== 401 && status !== 403) return;
  setAccessToken(null);
  clearAuthSession();
  markSessionExpired();
};

// 여러 곳에서 동시에 호출해도 refresh HTTP 요청은 한 번만 발생
export const ensureToken = () => {
  if (accessToken) return Promise.resolve();
  if (_refreshPromise) return _refreshPromise;
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) return Promise.resolve();
  _refreshPromise = axios.post(
    `${import.meta.env.VITE_API_URL}/auth/refresh`,
    { refreshToken: storedRefreshToken }
  ).then(res => {
    applyRefreshedTokens(res.data);
  }).catch(handleRefreshFailure).finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// 요청 인터셉터: Authorization 헤더 자동 첨부
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 자동 토큰 갱신
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const storedRefreshToken = getRefreshToken();
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken }
        );
        applyRefreshedTokens(res.data);
        const newToken = res.data.accessToken;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleRefreshFailure(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
