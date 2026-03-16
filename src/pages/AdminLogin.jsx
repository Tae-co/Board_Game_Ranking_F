import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';

const AdminLogin = () => {
  const [tab, setTab] = useState('admin'); // 'admin' | 'phone'

  // 관리자 로그인
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // 전화번호 로그인
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneStep, setPhoneStep] = useState(1); // 1: 전화번호, 2: 비밀번호
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  const navigate = useNavigate();

  const saveLoginData = (data) => {
    setAccessToken(data.accessToken);
    localStorage.setItem('userId', data.memberId);
    localStorage.setItem('nickname', data.nickname);
    localStorage.setItem('role', data.role);
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

  const handleCheckPhone = async () => {
    if (phone.length < 10) { setPhoneError('올바른 전화번호를 입력하세요.'); return; }
    setPhoneError('');
    setPhoneLoading(true);
    try {
      const res = await api.post('/auth/check-phone', { phoneNumber: phone });
      if (res.data.exists) {
        setPhoneStep(2);
      } else {
        setPhoneError('등록되지 않은 전화번호입니다.');
      }
    } catch {
      setPhoneError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!password) { setPhoneError('비밀번호를 입력하세요.'); return; }
    setPhoneError('');
    setPhoneLoading(true);
    try {
      const res = await api.post('/auth/login', { phoneNumber: phone, password });
      saveLoginData(res.data);
    } catch {
      setPhoneError('비밀번호가 틀렸습니다.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const inputStyle = { backgroundColor: '#FFF8F0', borderColor: '#E5D5C0', color: '#2C1F0E' };
  const inputClass = 'w-full px-4 py-3 rounded-lg border focus:outline-none transition-all';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#D4853A' }}>
            <ShieldCheck className="w-10 h-10" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
        <h1 className="text-3xl mb-2" style={{ color: '#2C1F0E' }}>관리자 로그인</h1>
        <p className="text-sm" style={{ color: '#8B7355' }}>관리자 전용 페이지입니다</p>
      </div>

      {/* 탭 */}
      <div className="w-full flex rounded-xl overflow-hidden border mb-4" style={{ borderColor: '#E5D5C0' }}>
        <button
          onClick={() => { setTab('admin'); setAdminError(''); }}
          className="flex-1 py-2 text-sm font-700 transition-colors"
          style={{
            background: tab === 'admin' ? '#D4853A' : '#FFF8F0',
            color: tab === 'admin' ? '#fff' : '#8B7355',
            fontWeight: 700,
          }}
        >
          관리자
        </button>
        <button
          onClick={() => { setTab('phone'); setPhoneError(''); setPhoneStep(1); setPhone(''); setPassword(''); }}
          className="flex-1 py-2 text-sm transition-colors"
          style={{
            background: tab === 'phone' ? '#D4853A' : '#FFF8F0',
            color: tab === 'phone' ? '#fff' : '#8B7355',
            fontWeight: 700,
          }}
        >
          테스트 계정
        </button>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl p-6 border shadow-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>

        {/* 관리자 로그인 */}
        {tab === 'admin' && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setAdminError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
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
                value={adminPassword}
                onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="비밀번호"
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
              />
            </div>
            {adminError && <p className="text-sm" style={{ color: '#dc2626' }}>{adminError}</p>}
            <button
              onClick={handleAdminLogin}
              disabled={adminLoading || !username.trim() || !adminPassword.trim()}
              className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {adminLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        )}

        {/* 전화번호 로그인 (테스트 계정) */}
        {tab === 'phone' && (
          <div className="space-y-4">
            {phoneStep === 1 && (
              <>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>전화번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckPhone()}
                    placeholder="01012345678"
                    maxLength={11}
                    autoFocus
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                    onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
                  />
                </div>
                {phoneError && <p className="text-sm" style={{ color: '#dc2626' }}>{phoneError}</p>}
                <button
                  onClick={handleCheckPhone}
                  disabled={phoneLoading || phone.length < 10}
                  className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                >
                  {phoneLoading ? '확인 중...' : '다음'}
                </button>
              </>
            )}

            {phoneStep === 2 && (
              <>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>비밀번호</label>
                  <p className="text-sm mb-3" style={{ color: '#8B7355' }}>{phone}</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPhoneError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneLogin()}
                    placeholder="비밀번호"
                    autoFocus
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                    onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
                  />
                </div>
                {phoneError && <p className="text-sm" style={{ color: '#dc2626' }}>{phoneError}</p>}
                <button
                  onClick={handlePhoneLogin}
                  disabled={phoneLoading}
                  className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                >
                  {phoneLoading ? '로그인 중...' : '로그인'}
                </button>
                <button
                  onClick={() => { setPhoneStep(1); setPassword(''); setPhoneError(''); }}
                  className="w-full py-2 text-sm"
                  style={{ color: '#8B7355' }}
                >
                  전화번호 다시 입력
                </button>
              </>
            )}
          </div>
        )}
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
