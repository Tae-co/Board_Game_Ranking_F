import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Moon, Sun } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
};

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
};

const Profile = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { themeKey, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const phone = localStorage.getItem('phone') || '';

  const { data: profileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const res = await api.get(`/members/${userId}`);
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['memberStats', userId],
    queryFn: async () => {
      const res = await api.get(`/members/${userId}/stats`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const currentNickname = profileData?.nickname || localStorage.getItem('nickname') || '';

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert(t('profile', 'nicknameSaved'));
      navigate('/lobby');
    } catch {
      alert(t('profile', 'nicknameFailed'));
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const nicknameHint = () => {
    if (nicknameStatus === 'same') return { text: t('profile', 'nicknameIsSame'), color: 'var(--th-text-sub)' };
    if (nicknameStatus === 'checking') return { text: t('profile', 'nicknameChecking'), color: 'var(--th-text-sub)' };
    if (nicknameStatus === 'ok') return { text: t('profile', 'nicknameAvailable'), color: '#16a34a' };
    if (nicknameStatus === 'taken') return { text: t('profile', 'nicknameTaken'), color: '#dc2626' };
    return null;
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;
    if (!window.confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    setIsDeletingAccount(true);
    try {
      await api.delete(`/members/${userId}`);
      setAccessToken(null);
      queryClient.clear();
      clearAuthSession();
      window.location.replace('/login');
    } catch (err) {
      alert(getErrorMessage(err, '탈퇴에 실패했습니다.'));
      setIsDeletingAccount(false);
    }
  };

  const canSaveNickname = nickname.trim().length >= 2
    && nickname.trim() !== currentNickname
    && nicknameStatus !== 'taken'
    && nicknameStatus !== 'checking';

  const inputStyle = {
    backgroundColor: 'var(--th-bg)',
    borderColor: 'var(--th-border)',
    color: 'var(--th-text)',
  };

  return (
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/lobby')}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--th-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{t('profile', 'title')}</h1>
      </div>

      {/* Profile Info Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
          >
            {currentNickname[0] || '?'}
          </div>
          <div>
            <p className="text-xl mb-1" style={{ color: 'var(--th-text)' }}>{currentNickname}</p>
            {phone && <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{maskPhone(phone)}</p>}
          </div>
        </div>
      </div>

      {/* Play Stats Card */}
      {stats && (
        <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
          <h2 className="text-lg mb-4" style={{ color: 'var(--th-text)' }}>🎲 {t('profile', 'myStats')}</h2>
          {stats.totalPlay === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: 'var(--th-text-sub)' }}>{t('profile', 'noStats')}</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {[
                  { label: t('profile', 'totalGames'), value: stats.totalPlay },
                  { label: t('profile', 'statsWins'),  value: stats.totalWin },
                  { label: t('profile', 'statsLosses'), value: stats.totalLose },
                  { label: t('profile', 'statsWinRate'), value: `${Math.round((stats.totalWin / stats.totalPlay) * 100)}%` },
                ].map(item => (
                  <div key={item.label} className="flex-1 rounded-xl p-2 text-center" style={{ backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)' }}>
                    <div className="text-base font-bold" style={{ color: 'var(--th-primary)' }}>{item.value}</div>
                    <div className="text-xs" style={{ color: 'var(--th-text-sub)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {stats.games.map(game => {
                const wr = Math.round((game.winCount / game.playCount) * 100);
                return (
                  <div key={game.gameName} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2"
                    style={{ backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--th-text)' }}>{game.gameName}</span>
                    <span className="text-xs" style={{ color: 'var(--th-text-sub)' }}>
                      {game.playCount}전 {game.winCount}승 {game.loseCount}패
                      <span className="ml-2 font-bold" style={{ color: 'var(--th-primary)' }}>{wr}%</span>
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Theme Settings Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {themeKey === 'ledger'
              ? <Moon className="w-5 h-5" style={{ color: 'var(--th-primary)' }} />
              : <Sun className="w-5 h-5" style={{ color: 'var(--th-primary)' }} />
            }
            <span className="text-base" style={{ color: 'var(--th-text)' }}>
              {themeKey === 'ledger' ? '다크 모드' : '라이트 모드'}
            </span>
          </div>
          {/* Toggle Switch */}
          <button
            onClick={() => setTheme(themeKey === 'ledger' ? 'default' : 'ledger')}
            style={{
              width: '52px', height: '28px', borderRadius: '14px', border: 'none',
              cursor: 'pointer', padding: '3px', transition: 'background-color 0.3s',
              backgroundColor: themeKey === 'ledger' ? 'var(--th-primary)' : 'var(--th-border)',
              display: 'flex', alignItems: 'center',
              justifyContent: themeKey === 'ledger' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'all 0.3s',
            }} />
          </button>
        </div>
      </div>

      {/* Language Settings Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <h2 className="text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--th-text)' }}>
          <Globe className="w-5 h-5" style={{ color: 'var(--th-primary)' }} />
          {t('profile', 'languageSettings')}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('ko')}
            className="flex-1 py-3 rounded-full border-2 transition-all"
            style={{
              backgroundColor: lang === 'ko' ? 'var(--th-primary)' : 'var(--th-card)',
              borderColor: 'var(--th-primary)',
              color: lang === 'ko' ? '#FFFFFF' : 'var(--th-primary)',
            }}
          >
            {t('profile', 'korean')}
          </button>
          <button
            onClick={() => setLang('en')}
            className="flex-1 py-3 rounded-full border-2 transition-all"
            style={{
              backgroundColor: lang === 'en' ? 'var(--th-primary)' : 'var(--th-card)',
              borderColor: 'var(--th-primary)',
              color: lang === 'en' ? '#FFFFFF' : 'var(--th-primary)',
            }}
          >
            {t('profile', 'english')}
          </button>
        </div>
      </div>

      {/* Nickname Change Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <h2 className="text-lg mb-4" style={{ color: 'var(--th-text)' }}>{t('profile', 'changeNickname')}</h2>
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
                borderColor: nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : 'var(--th-border)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : 'var(--th-border)'}
            />
            {nicknameHint() && (
              <p className="text-xs mt-1 px-1" style={{ color: nicknameHint().color }}>{nicknameHint().text}</p>
            )}
          </div>
          <button
            onClick={handleSaveNickname}
            disabled={!canSaveNickname || isNicknameSaving}
            className="w-full py-3 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isNicknameSaving ? t('profile', 'savingNickname') : t('profile', 'saveNickname')}
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <h2 className="text-base mb-1" style={{ color: '#dc2626' }}>회원 탈퇴</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--th-text-sub)' }}>
          탈퇴 시 모든 게임 기록과 랭킹이 삭제됩니다. 방장인 그룹은 랭킹 1위 멤버에게 자동 위임됩니다.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeletingAccount}
          className="w-full py-3 rounded-full transition-opacity"
          style={{
            backgroundColor: 'transparent',
            color: '#dc2626',
            border: '1px solid #dc2626',
            opacity: isDeletingAccount ? 0.6 : 1,
            cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
          }}
        >
          {isDeletingAccount ? '탈퇴 처리 중...' : '회원 탈퇴'}
        </button>
      </div>

    </div>
  );
};

export default Profile;
