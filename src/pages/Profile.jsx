import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setAccessToken } from '../api/axios';
import { getMember, getMemberStats, getMemberTrophies, updateProfileImage as updateProfileImageApi, deleteMember } from '../api/services/members';
import { uploadProfileImage } from '../api/uploadImage';
import { clearAuthSession, getAuthUserId, getNickname } from '../auth/storage';
import { setProfileImage } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { useNicknameEdit } from '../hooks/useNicknameEdit';
import { TierBadge } from '../components/TierBadge';
import { V } from '../utils/cssUtils';
import { getErrorMessage, getTierFromRating, getTierBg } from '../utils/tierUtils';
import FeedbackModal from '../components/shared/FeedbackModal';
import { getAvatarColorById } from '../utils/avatarUtils';
import TrophyShelf from '../components/season/TrophyShelf';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import NicknameEditor from '../components/profile/NicknameEditor';
import ProfileStats from '../components/profile/ProfileStats';
import AccountSettings from '../components/profile/AccountSettings';
import DeleteAccountCard from '../components/profile/DeleteAccountCard';
import StoreProfileStats from '../components/store/StoreProfileStats';
import ProfileStoreSwitcher from '../components/store/ProfileStoreSwitcher';
import { InfoPopup } from '../components/store/StorePopup';
import { InfoIcon } from '../components/store/StoreIcons';

const Profile = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { themeKey, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const userId = getAuthUserId();

  const { data: profileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getMember(userId),
  });

  const { data: stats } = useQuery({
    queryKey: ['memberStats', userId],
    queryFn: () => getMemberStats(userId),
    staleTime: 1000 * 60 * 5,
  });

  // 트로피 선반 — 시상 자격을 통과한 1~3위만 서버가 준다. 없으면 선반 자체를 숨긴다.
  const { data: trophies = [] } = useQuery({
    queryKey: ['trophies', userId],
    queryFn: () => getMemberTrophies(userId),
    staleTime: 1000 * 60 * 10,
  });

  // 프로필 매장 탭 (plan-store 7): 가입한 매장마다 이번 시즌 기록
  const { data: storeProfiles = [] } = useQuery({
    queryKey: ['storeProfile', userId],
    queryFn: () => import('../api/services/stores').then(m => m.getStoreProfile()),
    staleTime: 1000 * 60,
  });
  const hasStores = storeProfiles.length > 0;
  const hasCommunityRecord = !stats || (stats.totalWin ?? 0) + (stats.totalLose ?? 0) > 0;
  const [mode, setMode] = useState(null); // null = 커뮤니티 기록이 없으면 매장 탭으로 열림
  const isStore = hasStores && (mode ?? (hasCommunityRecord ? 'general' : 'store')) === 'store';
  const [storeIdx, setStoreIdx] = useState(0);
  const curStore = isStore ? storeProfiles[Math.min(storeIdx, storeProfiles.length - 1)] : null;
  const [tierInfo, setTierInfo] = useState(false);

  useEffect(() => {
    if (profileData?.profileImage !== undefined) {
      setProfileImage(profileData.profileImage || null);
    }
  }, [profileData]);

  const currentNickname = profileData?.nickname || getNickname() || '';
  const maxRating = Math.round(profileData?.overallRating ?? 500);
  const shownRating = curStore ? curStore.bestScore : maxRating;
  const tier = getTierFromRating(shownRating);
  const tierStyle = getTierBg(tier.label);
  const tierName = t('profile', `tier${tier.label}`);

  const nicknameEdit = useNicknameEdit({ userId, currentNickname, t });
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 사진을 바꾸거나 기본으로 돌린 뒤: 저장해 두고 헤더 아바타에 알리고 프로필을 다시 받는다
  const applyProfileImage = (url) => {
    setProfileImage(url);
    window.dispatchEvent(new Event('profileImageUpdated'));
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploadingPhoto(true);
    try {
      const url = await uploadProfileImage(file, profileData?.profileImage);
      await updateProfileImageApi(userId, url);
      applyProfileImage(url);
    } catch { alert(t('profile', 'photoUploadFailed')); }
    finally { setIsUploadingPhoto(false); }
  };

  const handleResetPhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await updateProfileImageApi(userId, null);
      applyProfileImage(null);
    } catch { alert(t('profile', 'photoResetFailed')); }
    finally { setIsUploadingPhoto(false); }
  };

  // 로그아웃·탈퇴 공통: 토큰·캐시·저장된 로그인 정보를 지우고 로그인 화면으로
  const leaveToLogin = () => {
    setAccessToken(null);
    queryClient.clear();
    clearAuthSession();
    window.location.replace('/login');
  };

  const handleSaveNickname = async () => {
    try {
      if (!(await nicknameEdit.save())) return;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['roomMembers'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setShowNicknameEdit(false);
      alert(t('profile', 'nicknameSaved'));
    } catch { alert(t('profile', 'nicknameFailed')); }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;
    if (!window.confirm(t('profile', 'deleteAccountConfirm'))) return;
    setIsDeletingAccount(true);
    try {
      await deleteMember(userId);
      leaveToLogin();
    } catch (err) {
      alert(getErrorMessage(err, t('profile', 'deleteAccountFailed')));
      setIsDeletingAccount(false);
    }
  };

  return (
    <div style={{ backgroundColor: V('--th-bg'), minHeight: '100vh', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: V('--th-primary'), flexShrink: 0 }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: V('--th-primary') }}>
            {t('profile', 'title')}
          </span>
          <button onClick={leaveToLogin} style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: V('--th-text-sub'), flexShrink: 0 }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile Card */}
        <div style={{
          borderRadius: 20, padding: 24,
          backgroundColor: V('--th-card'),
          border: '2px solid var(--th-primary)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <ProfileAvatar
            profileImage={profileData?.profileImage}
            avatarColor={getAvatarColorById(userId)}
            storeMode={isStore}
            isUploading={isUploadingPhoto}
            onPhotoSelect={handlePhotoSelect}
            onResetPhoto={handleResetPhoto}
            onToggleNicknameEdit={() => setShowNicknameEdit(v => !v)}
            t={t}
          />

          {/* Name & level */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: V('--th-text'), marginBottom: 4 }}>
              {currentNickname}
            </div>
            <div style={{ fontSize: 13, color: V('--th-text-sub') }}>
              {curStore ? `${curStore.branch || curStore.name} ` : ''}
              {t('profile', 'tierMember').replace('{tier}', tierName.charAt(0) + tierName.slice(1).toLowerCase())}
            </div>
          </div>

          {hasStores && (
            <ProfileStoreSwitcher
              isStore={isStore}
              onModeChange={setMode}
              storeProfiles={storeProfiles}
              currentStoreId={curStore?.storeId}
              onStoreSelect={setStoreIdx}
              t={t}
            />
          )}

          {!isStore && !hasCommunityRecord && hasStores && (
            <div style={{ width: '100%', boxSizing: 'border-box', borderRadius: 14, border: `1px dashed var(--th-border)`, padding: 18, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: V('--th-text') }}>{t('profile', 'noCommunityRecord')}</span>
              <span style={{ fontSize: 12, lineHeight: 1.5, color: V('--th-text-sub') }}>{t('profile', 'noCommunityRecordDesc')}</span>
            </div>
          )}

          {/* Current Tier box */}
          {(isStore || hasCommunityRecord || !hasStores) && <div style={{
            width: '100%', borderRadius: 14,
            backgroundColor: tierStyle.bg,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: tierStyle.text, letterSpacing: '0.08em' }}>
                  {t('profile', isStore ? 'seasonTier' : 'currentTier')}
                </span>
                {hasStores && (
                  <button onClick={() => setTierInfo(true)} aria-label={t('profile', 'tierInfoAria')} style={{
                    width: 24, height: 24, padding: 0, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer',
                    color: tierStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><InfoIcon size={14} /></button>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: tierStyle.text }}>
                {tierName}
              </div>
            </div>
            <TierBadge tier={tier} size="lg" />
          </div>}

          {trophies.length > 0 && (
            <div style={{ width: '100%' }}>
              <TrophyShelf trophies={trophies} t={t} />
            </div>
          )}

          {showNicknameEdit && <NicknameEditor edit={nicknameEdit} onSave={handleSaveNickname} t={t} />}
        </div>

        {/* 매장 탭: 승·패·승률·점수 + 이번 시즌 순위·가장 많이 한 게임·초기화·방문 */}
        {curStore && <StoreProfileStats sp={curStore} navigate={navigate} t={t} />}

        {!isStore && hasCommunityRecord && stats && <ProfileStats wins={stats.totalWin ?? 0} losses={stats.totalLose ?? 0} bestScore={maxRating} />}

        <AccountSettings
          themeKey={themeKey}
          onToggleTheme={() => setTheme(themeKey === 'ledger' ? 'default' : 'ledger')}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          t={t}
        />

        {/* Feedback / Bug Report */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 18px', borderRadius: 18,
            backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
            cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <MessageSquarePlus size={18} style={{ color: V('--th-primary'), flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: V('--th-text') }}>
            {t('profile', 'feedbackButton')}
          </span>
          <ChevronRight size={16} style={{ color: V('--th-text-sub') }} />
        </button>

        <DeleteAccountCard isDeleting={isDeletingAccount} onDelete={handleDeleteAccount} t={t} />

      </div>

      {tierInfo && (
        <InfoPopup
          title={t('store', 'infoTitle')}
          text={t('profile', isStore ? 'tierInfoStore' : 'tierInfoGeneral')}
          okLabel={t('store', 'infoOk')}
          onClose={() => setTierInfo(false)}
        />
      )}

      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </div>
  );
};

export default Profile;
