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
