import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAccessToken } from '../api/axios';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/admin-login', { username, password });
      setAccessToken(res.data.accessToken);
      localStorage.setItem('userId', res.data.memberId);
      localStorage.setItem('nickname', res.data.nickname);
      localStorage.setItem('role', res.data.role);
      navigate('/lobby');
    } catch {
      setError('아이디 또는 비밀번호가 틀렸습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1C1208] flex flex-col px-6 py-12">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/login')}
        className="text-[#A08060] text-sm font-semibold flex items-center gap-1 mb-10 self-start hover:text-[#D4853A] transition-colors"
      >
        ← 로그인으로
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-[#2C1F0E] rounded-2xl border border-[#3D2B14] shadow-lg overflow-hidden">
          <div className="h-0.5 w-full bg-[#D4853A]" />
          <div className="p-7 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#A08060] mb-1">관리자 전용</p>
              <h2 className="text-2xl font-black text-[#F5E6D0]">관리자 로그인</h2>
            </div>

            <input
              type="text"
              placeholder="아이디"
              className="w-full px-4 py-3.5 bg-[#241A0A] border border-[#3D2B14] rounded-xl text-[#F5E6D0] font-semibold outline-none focus:border-[#D4853A] transition-colors placeholder-[#A08060]"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />

            <input
              type="password"
              placeholder="비밀번호"
              className="w-full px-4 py-3.5 bg-[#241A0A] border border-[#3D2B14] rounded-xl text-[#F5E6D0] font-semibold outline-none focus:border-[#D4853A] transition-colors placeholder-[#A08060]"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />

            {error && (
              <p className="text-xs font-semibold text-red-400 px-1">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-4 rounded-full bg-[#D4853A] text-[#1C1208] font-black text-base active:scale-95 transition-transform disabled:opacity-60"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
