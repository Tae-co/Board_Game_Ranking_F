import api from '../axios';

// Content-Type을 undefined로 지정해 브라우저가 multipart/form-data boundary를 자동 설정하게 함
export const postImage = (endpoint, formData) =>
  api.post(endpoint, formData, { headers: { 'Content-Type': undefined } }).then(r => r.data.url);
