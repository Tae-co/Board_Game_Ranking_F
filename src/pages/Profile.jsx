import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Sun, Moon, LogOut, Pencil, ChevronRight, Camera } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { TierBadge, TIERS } from '../components/TierBadge';

const V = (v) => `var(${v})`;

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
};

const getTierFromRating = (rating = 1500) => {
  if (rating >= 2500) return { ...TIERS.diamond, label: 'DIAMOND' };
  if (rating >= 2000) return { ...TIERS.platinum, label: 'PLATINUM' };
  if (rating >= 1500) return { ...TIERS.gold, label: 'GOLD' };
  if (rating >= 1000) return { ...TIERS.silver, label: 'SILVER' };
  return { ...TIERS.bronze, label: 'BRONZE' };
};

const getTierBg = (label) => {
  switch (label) {
    case 'DIAMOND': return { bg: '#EEF2FF', text: '#3730A3' };
    case 'PLATINUM': return { bg: '#F0FDFA', text: '#0F766E' };
    case 'GOLD': return { bg: '#FFFBEB', text: '#B45309' };
    case 'SILVER': return { bg: '#F8FAFC', text: '#475569' };
    default: return { bg: '#FFF7ED', text: '#9A3412' };
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { themeKey, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');

  const { data: profileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => { const res = await api.get(`/members/${userId}`); return res.data; },
  });

  const { data: stats } = useQuery({
    queryKey: ['memberStats', userId],
    queryFn: async () => { const res = await api.get(`/members/${userId}/stats`); return res.data; },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (profileData?.profileImage !== undefined) {
      if (profileData.profileImage) localStorage.setItem('profileImage', profileData.profileImage);
      else localStorage.removeItem('profileImage');
    }
  }, [profileData]);

  const currentNickname = profileData?.nickname || localStorage.getItem('nickname') || '';
  const maxRating = Math.round(profileData?.overallRating ?? 1500);
  const tier = getTierFromRating(maxRating);
  const tierStyle = getTierBg(tier.label);

  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data.url;
      await api.patch(`/members/${userId}/profile-image`, { profileImage: url });
      localStorage.setItem('profileImage', url);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    } catch { alert('사진 업로드에 실패했습니다.'); }
    finally { setIsUploadingPhoto(false); }
  };

  const handleLogout = () => {
    setAccessToken(null);
    queryClient.clear();
    clearAuthSession();
    window.location.replace('/login');
  };

  const checkNickname = async (value) => {
    if (!value.trim() || value.length < 2) { setNicknameStatus(null); return; }
    if (value.trim() === currentNickname) { setNicknameStatus('same'); return; }
    setNicknameStatus('checking');
    try {
      const res = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(value)}`);
      setNicknameStatus(res.data.available ? 'ok' : 'taken');
    } catch { setNicknameStatus(null); }
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
      setShowNicknameEdit(false);
      alert(t('profile', 'nicknameSaved'));
    } catch { alert(t('profile', 'nicknameFailed')); }
    finally { setIsNicknameSaving(false); }
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

  const nicknameHint = () => {
    if (nicknameStatus === 'same') return { text: t('profile', 'nicknameIsSame'), color: V('--th-text-sub') };
    if (nicknameStatus === 'checking') return { text: t('profile', 'nicknameChecking'), color: V('--th-text-sub') };
    if (nicknameStatus === 'ok') return { text: t('profile', 'nicknameAvailable'), color: '#16a34a' };
    if (nicknameStatus === 'taken') return { text: t('profile', 'nicknameTaken'), color: '#dc2626' };
    return null;
  };

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', backgroundColor: V('--th-bg'), minHeight: '100vh', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: V('--th-nav-bg'),
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <button onClick={() => navigate(-1)} style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: V('--th-primary'), flexShrink: 0 }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: V('--th-primary') }}>
          {t('profile', 'title')}
        </span>
        <button onClick={handleLogout} style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: V('--th-text-sub'), flexShrink: 0 }}>
          <LogOut size={20} />
        </button>
      </div>

      <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile Card */}
        <div style={{
          borderRadius: 20, padding: 24,
          backgroundColor: V('--th-card'),
          border: '2px solid var(--th-primary)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 84, height: 84, borderRadius: '50%',
                backgroundColor: 'var(--th-primary)',
                border: '3px solid var(--th-primary)',
                boxShadow: '0 0 0 3px color-mix(in srgb, var(--th-primary) 20%, transparent)',
                overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              {profileData?.profileImage ? (
                <img
                  src={profileData.profileImage}
                  alt="profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 34 }}>
                  {(currentNickname[0] || '?').toUpperCase()}
                </span>
              )}
              {isUploadingPhoto && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 26, height: 26, borderRadius: '50%',
                backgroundColor: '#fff', border: '2px solid var(--th-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
            >
              <Camera size={12} color="var(--th-primary)" />
            </button>

            {/* Nickname edit button */}
            <button
              onClick={() => setShowNicknameEdit(v => !v)}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                backgroundColor: 'var(--th-primary)', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Pencil size={12} color="#fff" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Name & level */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: V('--th-text'), marginBottom: 4 }}>
              {currentNickname}
            </div>
            <div style={{ fontSize: 13, color: V('--th-text-sub') }}>
              {tier.label.charAt(0) + tier.label.slice(1).toLowerCase()} Member
            </div>
          </div>

          {/* Current Tier box */}
          <div style={{
            width: '100%', borderRadius: 14,
            backgroundColor: tierStyle.bg,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tierStyle.text, letterSpacing: '0.08em', marginBottom: 3 }}>
                CURRENT TIER
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: tierStyle.text }}>
                {tier.label}
              </div>
            </div>
            <TierBadge tier={tier} size="lg" />
          </div>

          {/* Nickname edit (toggle) */}
          {showNicknameEdit && (
            <div style={{ width: '100%' }}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                placeholder={t('profile', 'nicknamePlaceholder')}
                maxLength={10}
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, outline: 'none',
                  backgroundColor: V('--th-bg'), color: V('--th-text'), boxSizing: 'border-box', marginBottom: 4,
                  border: `1.5px solid ${nicknameStatus === 'ok' ? '#16a34a' : nicknameStatus === 'taken' ? '#dc2626' : 'var(--th-border)'}`,
                }}
              />
              {nicknameHint() && (
                <p style={{ fontSize: 12, marginBottom: 8, color: nicknameHint().color, paddingLeft: 4 }}>{nicknameHint().text}</p>
              )}
              <button
                onClick={handleSaveNickname}
                disabled={!canSaveNickname || isNicknameSaving}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 50, border: 'none',
                  cursor: canSaveNickname ? 'pointer' : 'not-allowed',
                  backgroundColor: 'var(--th-primary)', color: '#fff', fontSize: 14, fontWeight: 700,
                  opacity: canSaveNickname && !isNicknameSaving ? 1 : 0.4,
                }}
              >
                {isNicknameSaving ? t('profile', 'savingNickname') : t('profile', 'saveNickname')}
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'WINS', value: stats.totalWin ?? 0, color: V('--th-text') },
              { label: 'LOSSES', value: stats.totalLose ?? 0, color: V('--th-text') },
              { label: 'BEST ELO', value: maxRating.toLocaleString(), color: 'var(--th-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                borderRadius: 16, padding: '16px 8px',
                backgroundColor: V('--th-card'),
                border: `1px solid var(--th-border)`,
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.06em', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account Settings */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: V('--th-text'), margin: '0 0 10px 4px' }}>
            Account Settings
          </p>
          <div style={{ borderRadius: 18, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Theme Mode */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid var(--th-border)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                {themeKey === 'ledger'
                  ? <Moon size={18} style={{ color: V('--th-primary') }} />
                  : <Sun size={18} style={{ color: V('--th-primary') }} />
                }
                <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text') }}>Theme Mode</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: V('--th-text-sub') }}>{themeKey === 'ledger' ? 'Dark' : 'Light'}</span>
                <button
                  onClick={() => setTheme(themeKey === 'ledger' ? 'default' : 'ledger')}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', padding: 3,
                    backgroundColor: themeKey !== 'ledger' ? 'var(--th-primary)' : 'var(--th-border)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: themeKey !== 'ledger' ? 'flex-end' : 'flex-start',
                    transition: 'background-color 0.25s',
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>

            {/* Language */}
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <Globe size={18} style={{ color: V('--th-primary') }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{t('profile', 'languageSettings')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: V('--th-text-sub') }}>{lang === 'ko' ? '한국어' : 'English'}</span>
                <ChevronRight size={16} style={{ color: V('--th-text-sub') }} />
              </div>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div style={{ borderRadius: 18, padding: '16px 18px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>회원 탈퇴</div>
          <p style={{ fontSize: 12, color: V('--th-text-sub'), margin: '0 0 12px' }}>
            탈퇴 시 모든 게임 기록과 랭킹이 삭제됩니다.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 50, fontSize: 13, fontWeight: 700,
              backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626',
              opacity: isDeletingAccount ? 0.6 : 1, cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
            }}
          >
            {isDeletingAccount ? '탈퇴 처리 중...' : '회원 탈퇴'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
