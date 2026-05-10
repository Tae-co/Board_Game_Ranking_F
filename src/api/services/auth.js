import api from '../axios';

export const sendOtp = (phoneNumber) => api.post('/auth/send-otp', { phoneNumber });
export const login = (phoneNumber, otpCode) =>
  api.post('/auth/login', { phoneNumber, otpCode }).then(r => r.data);
export const getNicknameByPhone = (phoneNumber) =>
  api.get(`/auth/nickname?phoneNumber=${encodeURIComponent(phoneNumber)}`).then(r => r.data);
export const checkNickname = (nickname) =>
  api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).then(r => r.data);
