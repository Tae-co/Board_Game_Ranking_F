import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 우리 백엔드 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;