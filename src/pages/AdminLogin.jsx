import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';

const AdminLogin = () => {
  // 관리자 로그인
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const navigate = useNavigate();

  const saveLoginData = (data) => {
    setAccessToken(data.accessToken);
    localStorage.setItem('userId', data.memberId);
    localStorage.setItem('nickname', data.nickname);
    localStorage.setItem('role', data.role);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    navigate('/lobby');
  };

  const handleAdminLogin = async () => {
    if (!username.trim() || !adminPassword.trim()) return;
    setAdminError('');
    setAdminLoading(true);
    try {
      const res = await api.post('/auth/admin-login', { username, password: adminPassword });
      saveLoginData(res.data);
    } catch {
      setAdminError('아이디 또는 비밀번호가 틀렸습니다.');
    } finally {
      setAdminLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg border focus:outline-none transition-all';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--th-primary)' }}>
            <ShieldCheck className="w-10 h-10" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
        <h1 className="text-3xl mb-2" style={{ color: 'var(--th-text)' }}>관리자 로그인</h1>
        <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>관리자 전용 페이지입니다</p>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl p-6 border shadow-lg" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        {/* 관리자 로그인 */}
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: 'var(--th-text-sub)' }}>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setAdminError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="관리자 아이디"
              autoFocus
              className={inputClass}
              style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm" style={{ color: 'var(--th-text-sub)' }}>비밀번호</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="비밀번호"
              className={inputClass}
              style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
          </div>
          {adminError && <p className="text-sm" style={{ color: '#dc2626' }}>{adminError}</p>}
          <button
            onClick={handleAdminLogin}
            disabled={adminLoading || !username.trim() || !adminPassword.trim()}
            className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
          >
            {adminLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>

      {/* Back link */}
      <button
        onClick={() => navigate('/login')}
        className="mt-6 text-sm transition-colors"
        style={{ color: 'var(--th-text-sub)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--th-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--th-text-sub)'}
      >
        일반 로그인으로 돌아가기
      </button>
    </div>
  );
};

export default AdminLogin;
