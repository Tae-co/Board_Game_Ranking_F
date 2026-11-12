import axios from 'axios';

// Railway 서버 워밍업 — 콜드 스타트 방지.
// bare axios 사용: api 인스턴스의 401/403 refresh 인터셉터를 타면 앱 시작 때 세션이 지워질 수 있다.
export const warmUpServer = () =>
  axios.get(`${import.meta.env.VITE_API_URL}/health`).catch(() => {});
