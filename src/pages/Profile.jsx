import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Globe } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
};

const Profile = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const currentNickname = localStorage.getItem('nickname') || '';
  const phone = localStorage.getItem('phone') || '';
  const userId = localStorage.getItem('userId');

  const [nickname, setNickname] = useState(currentNickname);
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [isPwLoading, setIsPwLoading] = useState(false);

  const checkNickname = async (value) => {
    if (!value.trim() || value.length < 2) { setNicknameStatus(null); return; }
    if (value.trim() === currentNickname) { setNicknameStatus('same'); return; }
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

  const handleSaveNickname = async () => {
    if (nickname.trim() === currentNickname) return;
    if (!nickname.trim() || nickname.length < 2) return;
    if (nicknameStatus === 'taken') return;
    setIsNicknameSaving(true);
    try {
      await api.patch(`/members/${userId}/nickname`, { nickname: nickname.trim() });
      localStorage.setItem('nickname', nickname.trim());
      alert(t('profile', 'nicknameSaved'));
      navigate('/lobby');
    } catch {
      alert(t('profile', 'nicknameFailed'));
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const nicknameHint = () => {
    if (nicknameStatus === 'same') return { text: t('profile', 'nicknameIsSame'), color: '#8B7355' };
    if (nicknameStatus === 'checking') return { text: t('profile', 'nicknameChecking'), color: '#8B7355' };
    if (nicknameStatus === 'ok') return { text: t('profile', 'nicknameAvailable'), color: '#16a34a' };
    if (nicknameStatus === 'taken') return { text: t('profile', 'nicknameTaken'), color: '#dc2626' };
    return null;
  };

  const canSaveNickname = nickname.trim().length >= 2
    && nickname.trim() !== currentNickname
    && nicknameStatus !== 'taken'
    && nicknameStatus !== 'checking';

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setPwError(t('profile', 'passwordMinError')); return; }
    if (newPassword !== confirmPassword) { setPwError(t('profile', 'passwordMismatch')); return; }
    setPwError('');
    setIsPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      alert(t('profile', 'passwordSaved'));
      navigate('/lobby');
    } catch (e) {
      setPwError(e.response?.data?.message || t('profile', 'passwordMismatch'));
    } finally {
      setIsPwLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#FFF8F0',
    borderColor: '#E5D5C0',
    color: '#2C1F0E',
  };

  return (
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/lobby')}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: '#D4853A' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl" style={{ color: '#2C1F0E' }}>{t('profile', 'title')}</h1>
      </div>

      {/* Profile Info Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
          >
            {currentNickname[0] || '?'}
          </div>
          <div>
            <p className="text-xl mb-1" style={{ color: '#2C1F0E' }}>{currentNickname}</p>
            {phone && <p className="text-sm" style={{ color: '#8B7355' }}>{maskPhone(phone)}</p>}
          </div>
        </div>
      </div>

      {/* Language Settings Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <h2 className="text-lg mb-4 flex items-center gap-2" style={{ color: '#2C1F0E' }}>
          <Globe className="w-5 h-5" style={{ color: '#D4853A' }} />
          {t('profile', 'languageSettings')}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('ko')}
            className="flex-1 py-3 rounded-full border-2 transition-all"
            style={{
              backgroundColor: lang === 'ko' ? '#D4853A' : '#FFFFFF',
              borderColor: '#D4853A',
              color: lang === 'ko' ? '#FFFFFF' : '#D4853A',
            }}
          >
            {t('profile', 'korean')}
          </button>
          <button
            onClick={() => setLang('en')}
            className="flex-1 py-3 rounded-full border-2 transition-all"
            style={{
              backgroundColor: lang === 'en' ? '#D4853A' : '#FFFFFF',
              borderColor: '#D4853A',
              color: lang === 'en' ? '#FFFFFF' : '#D4853A',
            }}
          >
            {t('profile', 'english')}
          </button>
        </div>
      </div>

      {/* Nickname Change Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <h2 className="text-lg mb-4" style={{ color: '#2C1F0E' }}>{t('profile', 'changeNickname')}</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
              placeholder={t('profile', 'nicknamePlaceholder')}
              maxLength={10}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none"
              style={{
                ...inputStyle,
                borderColor: nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : '#E5D5C0',
              }}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : '#E5D5C0'}
            />
            {nicknameHint() && (
              <p className="text-xs mt-1 px-1" style={{ color: nicknameHint().color }}>{nicknameHint().text}</p>
            )}
          </div>
          <button
            onClick={handleSaveNickname}
            disabled={!canSaveNickname || isNicknameSaving}
            className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isNicknameSaving ? t('profile', 'savingNickname') : t('profile', 'saveNickname')}
          </button>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <h2 className="text-lg mb-4 flex items-center gap-2" style={{ color: '#2C1F0E' }}>
          <User className="w-5 h-5" style={{ color: '#D4853A' }} />
          {t('profile', 'changePassword')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('profile', 'currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPwError(''); }}
              placeholder={t('profile', 'currentPasswordPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('profile', 'newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPwError(''); }}
              placeholder={t('profile', 'newPasswordPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#8B7355' }}>{t('profile', 'confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPwError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
              placeholder={t('profile', 'confirmPasswordPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#D4853A'}
              onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
            />
          </div>
          {pwError && <p className="text-sm" style={{ color: '#dc2626' }}>{pwError}</p>}
          <button
            onClick={handleChangePassword}
            disabled={isPwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isPwLoading ? t('profile', 'savingPassword') : t('profile', 'savePassword')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
