import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
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

  const inputStyle = { backgroundColor: '#FFF8F0', borderColor: '#E5D5C0', color: '#2C1F0E' };
  const inputClass = 'w-full px-4 py-3 rounded-lg border focus:outline-none transition-all';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Logo */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#D4853A' }}>
            <ShieldCheck className="w-10 h-10" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
        <h1 className="text-3xl mb-2" style={{ color: '#2C1F0E' }}>관리자 로그인</h1>
        <p className="text-sm" style={{ color: '#8B7355' }}>관리자 전용 페이지입니다</p>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl p-6 border shadow-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="관리자 아이디"
              autoFocus
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호"
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
          </div>
          {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>

      {/* Back link */}
      <button
        onClick={() => navigate('/login')}
        className="mt-6 text-sm transition-colors"
        style={{ color: '#8B7355' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#D4853A'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#8B7355'}
      >
        일반 로그인으로 돌아가기
      </button>
    </div>
  );
};

export default AdminLogin;
