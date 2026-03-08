import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { useLanguage } from '../i18n/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [nickname, setNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const saveLoginData = (data) => {
    setAccessToken(data.accessToken);
    localStorage.setItem('userId', data.memberId);
    localStorage.setItem('nickname', data.nickname);
    localStorage.setItem('role', data.role);
    if (phone) localStorage.setItem('phone', phone);
    navigate('/lobby');
  };

  const handleCheckPhone = async () => {
    if (phone.length < 10) { setError(t('login', 'phoneError')); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/check-phone', { phoneNumber: phone });
      if (res.data.exists) {
        setIsExisting(true);
        setStep(2);
      } else {
        await api.post('/auth/send-otp', { phoneNumber: phone });
        setIsExisting(false);
        setStep(2);
      }
    } catch {
      setError(t('login', 'generalError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingLogin = async () => {
    if (!password) { setError(t('login', 'passwordError')); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { phoneNumber: phone, password });
      saveLoginData(res.data);
    } catch {
      setError(t('login', 'loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError(t('login', 'otpError')); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phoneNumber: phone, otpCode: otp });
      setMemberId(res.data.memberId);
      setStep(3);
    } catch {
      setError(t('login', 'otpFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const checkNickname = async (value) => {
    if (!value.trim() || value.length < 2) { setNicknameStatus(null); return; }
    setNicknameStatus('checking');
    try {
      const res = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(value)}`);
      setNicknameStatus(res.data.available ? 'ok' : 'taken');
    } catch {
      setNicknameStatus(null);
    }
  };

  const handleNicknameChange = (val) => {
    setNickname(val);
    setNicknameStatus(null);
    clearTimeout(window._nicknameTimer);
    window._nicknameTimer = setTimeout(() => checkNickname(val), 500);
  };

  const handleRegister = async () => {
    if (!nickname.trim() || nickname.length < 2) { setError(t('login', 'nicknameMinError')); return; }
    if (nicknameStatus === 'taken') { setError(t('login', 'nicknameTakenError')); return; }
    if (!newPassword || newPassword.length < 6) { setError(t('login', 'passwordMinError')); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { memberId, nickname: nickname.trim(), password: newPassword });
      saveLoginData(res.data);
    } catch {
      setError(t('login', 'registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const nicknameHint = () => {
    if (nicknameStatus === 'checking') return { text: t('login', 'nicknameChecking'), color: '#8B7355' };
    if (nicknameStatus === 'ok') return { text: t('login', 'nicknameAvailable'), color: '#16a34a' };
    if (nicknameStatus === 'taken') return { text: t('login', 'nicknameTaken'), color: '#dc2626' };
    return null;
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
            <Dices className="w-10 h-10" style={{ color: '#FFFFFF' }} />
          </div>
        </div>
        <h1 className="text-3xl mb-2" style={{ color: '#2C1F0E' }}>{t('login', 'title')}</h1>
        <p className="text-sm" style={{ color: '#8B7355' }}>{t('login', 'subtitle')}</p>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl p-6 border shadow-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('login', 'phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckPhone()}
                placeholder={t('login', 'phonePlaceholder')}
                maxLength={11}
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
              />
            </div>
            {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
            <button
              onClick={handleCheckPhone}
              disabled={isLoading || phone.length < 10}
              className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {isLoading ? t('login', 'checking') : t('login', 'next')}
            </button>

            {/* 소셜 로그인 구분선 */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5D5C0' }} />
              <span className="text-xs" style={{ color: '#8B7355' }}>또는</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5D5C0' }} />
            </div>

            {/* 카카오 로그인 */}
            <button
              onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/kakao`; }}
              className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-opacity"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.378c0 2.1 1.393 3.944 3.493 4.99l-.888 3.31a.187.187 0 0 0 .287.2l3.78-2.506A8.64 8.64 0 0 0 9 13.256c4.142 0 7.5-2.634 7.5-5.878S13.142 1.5 9 1.5Z" fill="#191919"/>
              </svg>
              카카오로 시작하기
            </button>

            {/* 구글 로그인 */}
            <button
              onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`; }}
              className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-medium border transition-opacity"
              style={{ backgroundColor: '#FFFFFF', color: '#2C1F0E', borderColor: '#E5D5C0' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              구글로 시작하기
            </button>
          </div>
        )}

        {/* Step 2a: 기존 회원 */}
        {step === 2 && isExisting && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('login', 'passwordLabel')}</label>
              <p className="text-sm mb-3" style={{ color: '#8B7355' }}>{phone}</p>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleExistingLogin()}
                placeholder={t('login', 'password')}
                autoFocus
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
              />
            </div>
            {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
            <button
              onClick={handleExistingLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {isLoading ? t('login', 'loggingIn') : t('login', 'login')}
            </button>
            <button
              onClick={() => { setStep(1); setPassword(''); setError(''); }}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: '#8B7355' }}
            >
              {t('login', 'backToPhone')}
            </button>
          </div>
        )}

        {/* Step 2b: 신규 회원 OTP */}
        {step === 2 && !isExisting && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('login', 'otpLabel')}</label>
              <p className="text-sm mb-4" style={{ color: '#8B7355' }}>{phone}{t('login', 'otpDesc')}</p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-1">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-10 h-12 text-lg border rounded-lg"
                        style={{ backgroundColor: '#FFF8F0', borderColor: '#E5D5C0', color: '#2C1F0E' }}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            {error && <p className="text-sm text-center" style={{ color: '#dc2626' }}>{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length < 6}
              className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {isLoading ? t('login', 'checking') : t('login', 'verifyOtp')}
            </button>
            <button
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: '#8B7355' }}
            >
              {t('login', 'backToPhone')}
            </button>
          </div>
        )}

        {/* Step 3: 닉네임 + 비밀번호 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('login', 'nicknameLabel')}</label>
              <p className="text-sm mb-4" style={{ color: '#8B7355' }}>{t('login', 'nicknameDesc')}</p>
              <input
                type="text"
                value={nickname}
                onChange={(e) => { handleNicknameChange(e.target.value); setError(''); }}
                placeholder={t('login', 'nicknamePlaceholder')}
                maxLength={10}
                autoFocus
                className={inputClass}
                style={{
                  ...inputStyle,
                  borderColor: nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : '#E5D5C0',
                }}
              />
              {nicknameHint() && (
                <p className="text-xs mt-1" style={{ color: nicknameHint().color }}>{nicknameHint().text}</p>
              )}
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder={t('login', 'passwordPlaceholder')}
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
            {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
            <button
              onClick={handleRegister}
              disabled={isLoading || nicknameStatus === 'taken' || nicknameStatus === 'checking'}
              className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {isLoading ? t('login', 'starting') : t('login', 'start')}
            </button>
          </div>
        )}
      </div>

      {/* Admin link */}
      <button
        onClick={() => navigate('/admin-login')}
        className="mt-6 text-sm transition-colors"
        style={{ color: '#8B7355' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#D4853A'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#8B7355'}
      >
        {t('login', 'adminLogin')}
      </button>
    </div>
  );
};

export default Login;
