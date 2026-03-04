import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
  const [step, setStep] = useState(1); // 1: 번호입력, 2: OTP입력
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  // 1. 인증번호 요청
  const handleRequestOtp = async () => {
    // 번호 길이 검증 추가
    if (phone.length < 10) {
      alert('올바른 전화번호를 입력해주세요.');
      return;
    }
    
    try {
      await api.post('/auth/send-otp', { phoneNumber: phone });
      setStep(2);
      alert('콘솔 창에 표시된 인증번호를 입력해주세요!');
    } catch (err) { 
      alert('발송 실패'); 
    }
  };

  // 2. 로그인 시도
  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { phoneNumber: phone, otpCode: otp });
      localStorage.setItem('userId', res.data.memberId);
      localStorage.setItem('nickname', res.data.nickname);
      
      // 기획에 따라 대기실(방 만들기) 화면으로 이동하도록 경로 수정 필요시 수정!
      navigate('/games'); 
    } catch (err) { 
      alert('인증번호가 틀렸습니다.'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-black mb-6 text-center text-slate-900">Login</h1>
        
        {step === 1 ? (
          <div className="space-y-4">
            <input 
              type="tel" // tel 타입으로 변경 (모바일에서 숫자 키패드 띄우기)
              placeholder="전화번호 (숫자만 입력)"
              className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold"
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} // 숫자만 입력되도록 처리
              maxLength={11} // 최대 11자리
            />
            <button onClick={handleRequestOtp} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg">
              인증번호 받기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="인증번호 6자리"
              className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold tracking-[1em] text-center"
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // 숫자만 입력되도록 처리
              maxLength={6} // OTP 6자리 제한
            />
            <button onClick={handleLogin} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg">
              로그인 완료
            </button>
            <button onClick={() => setStep(1)} className="w-full text-slate-400 font-bold text-sm">
              번호 다시 입력하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;