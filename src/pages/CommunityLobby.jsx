import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { CommunityCardSkeleton } from '../components/Skeleton';
import { joinCommunity, getMyCommunities, getJoinedCommunities, leaveCommunity } from '../api/services/communities';
import { EVENTS, logEvent } from '../api/services/events';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import CommunityCard from '../components/community/CommunityCard';
import LeaveConfirmModal from '../components/shared/LeaveConfirmModal';
import WelcomeBanner from '../components/shared/WelcomeBanner';
import JoinCodeModal from '../components/community/JoinCodeModal';
import JoinConfirmModal from '../components/community/JoinConfirmModal';
import FirstVisitChoices from '../components/community/FirstVisitChoices';
import CommunitySectionHeader from '../components/community/CommunitySectionHeader';
import CreateCommunityBanner from '../components/community/CreateCommunityBanner';
import { getNickname, getAuthUserId, getRole } from '../auth/storage';
import { enterCommunity, setMyCommunity, removeMyCommunity, sortByRecentVisit, getSelectedCommunity, removeSelectedCommunity } from '../utils/storage';
import { useApiErrorMessage } from '../hooks/useApiErrorMessage';

const DiceLogo = () => (
  <img src="/logo.png" width="28" height="28" style={{ objectFit: 'contain' }} alt="logo" />
);


const CommunityLobby = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const errorText = useApiErrorMessage();
  const nickname = getNickname() || '?';
  const userId = getAuthUserId();
  const isSystemAdmin = getRole() === 'ADMIN';

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [leavingCommunity, setLeavingCommunity] = useState(null);

  useEffect(() => {
    if (showJoinInput) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showJoinInput]);

  const { data: myCommunities = [], isLoading: myLoading, isLoadingError: myError, refetch: refetchMy, isFetching: myFetching } = useQuery({
    queryKey: ['myCommunitiesList', userId],
    queryFn: async () => {
      if (!userId) return [];
      return getMyCommunities(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (myCommunities.length > 0) setMyCommunity(myCommunities[0]);
    else if (myCommunities.length === 0 && userId) removeMyCommunity();
  }, [myCommunities, userId]);

  const { data: joinedCommunities = [], isLoading: joinedLoading, isLoadingError: joinedError, refetch: refetchJoined, isFetching: joinedFetching } = useQuery({
    queryKey: ['joinedCommunities', userId],
    queryFn: async () => {
      if (!userId) return [];
      return getJoinedCommunities(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // 둘 다 불러온 뒤에만 판단한다. 로딩 중에 첫 방문 화면이 번쩍였다 사라지면 안 된다.
  // 요청이 실패해도 목록은 빈 배열이다 — "없습니다"나 첫 방문 화면 대신 실패했다고 말한다.
  // 한 번도 못 받았을 때만이다. 참가 직후 새로고침 같은 백그라운드 재요청이 실패했다고
  // 이미 받아둔 목록을 오류 화면으로 가리면 안 된다.
  const loadFailed = myError || joinedError;
  const isFirstVisit = !myLoading && !joinedLoading && !loadFailed
    && myCommunities.length === 0 && joinedCommunities.length === 0;

  const handleEnterCommunity = (community) => {
    enterCommunity(community, userId);
    navigate('/lobby');
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    setPendingJoinCode(joinCode.trim());
    setShowJoinInput(false);
    setShowJoinConfirm(true);
  };

  const handleJoinConfirm = async () => {
    setShowJoinConfirm(false);
    setJoinLoading(true);
    try {
      const res = await joinCommunity(pendingJoinCode);
      setJoinCode('');
      setPendingJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities', userId] });
      // 목록에 남겨두면 참가했는지조차 모른다 — 들어간 모임으로 바로 보낸다.
      // 원래 있던 모임이면 그냥 들어가기만 한다 ("들어왔어요"를 띄우지 않는다).
      enterCommunity(res.data, userId);
      navigate('/lobby', { state: { justJoined: !res.data.alreadyMember } });
    } catch (e) {
      // 확인 팝업으로 넘어가며 입력창을 닫았다 — 다시 열어야 오류가 보인다. 코드는 남겨 고쳐 쓰게 한다.
      setJoinError(errorText(e, t('community', 'invalidCode')));
      setJoinCode(pendingJoinCode);
      setShowJoinInput(true);
    } finally {
      setJoinLoading(false);
    }
  };

  // 참가 퍼널의 시작. 첫 방문 화면과 '참가한 커뮤니티' + 버튼 두 곳에서 연다.
  const openJoinInput = () => {
    logEvent(EVENTS.COMMUNITY_JOIN_STARTED);
    setJoinCode('');
    setJoinError('');
    setShowJoinInput(true);
  };

  const handleJoinCancel = () => {
    setShowJoinConfirm(false);
    setPendingJoinCode('');
  };

  const handleLeft = (community) => {
    // 마지막으로 들어갔던 커뮤니티였으면 로비가 나간 곳을 다시 열지 않게 지운다
    if (getSelectedCommunity()?.communityId === community.communityId) removeSelectedCommunity();
    queryClient.invalidateQueries({ queryKey: ['joinedCommunities', userId] });
    setLeavingCommunity(null);
  };

  const handleManage = (community) => {
    setMyCommunity(community);
    navigate('/manage-community');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 40 }}>

      {/* 커뮤니티 참가 확인 팝업 */}
      {showJoinConfirm && (
        <JoinConfirmModal code={pendingJoinCode} onCancel={handleJoinCancel} onConfirm={handleJoinConfirm} t={t} />
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiceLogo />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              Yada Rank
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSystemAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
              >
                <Shield style={{ width: 20, height: 20 }} />
              </button>
            )}
            <NavAvatar />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 0' }}>

        <WelcomeBanner nickname={nickname} t={t} marginBottom="28px" />

        {/* 첫 방문: 이 앱은 혼자 쓸 수 없다. 빈 목록 두 개 대신 "만들기 / 참가" 둘 중 하나를 고르게 한다 */}
        {loadFailed ? (
          <div style={{
            backgroundColor: V('--th-card'), borderRadius: '18px',
            border: `1px solid var(--th-border)`, padding: '28px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: '0 0 6px' }}>
              {t('community', 'loadFailedTitle')}
            </p>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 18px' }}>
              {t('community', 'loadFailedDesc')}
            </p>
            <button
              onClick={() => { refetchMy(); refetchJoined(); }}
              disabled={myFetching || joinedFetching}
              style={{
                padding: '12px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
              }}
            >
              {myFetching || joinedFetching ? '...' : t('community', 'loadFailedRetry')}
            </button>
          </div>
        ) : isFirstVisit ? (
          <FirstVisitChoices onCreate={() => navigate('/create-community')} onJoin={openJoinInput} t={t} />
        ) : (<>
        <CommunitySectionHeader title={t('community', 'joinedCommunities')} onAdd={openJoinInput} />
        {joinedLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[0, 1].map(i => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : joinedCommunities.length === 0 ? (
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0 28px' }}>
            {t('community', 'noJoinedCommunities')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {sortByRecentVisit(joinedCommunities).map((community) => {
              const isAdmin = (community.admins ?? []).some(a => a.memberId === Number(userId));
              return (
                <CommunityCard
                  key={community.communityId}
                  community={community}
                  onEnter={handleEnterCommunity}
                  onManage={isAdmin ? handleManage : undefined}
                  onLeave={setLeavingCommunity}
                  t={t}
                />
              );
            })}
          </div>
        )}

        <CommunitySectionHeader
          title={t('community', 'myCommunity')}
          onAdd={myCommunities.length > 0 ? () => navigate('/create-community') : undefined}
        />

        {myLoading ? (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, paddingLeft: 10 }}>
            {[0, 1].map(i => <div key={i} style={{ flex: '0 0 calc(100% - 40px)' }}><CommunityCardSkeleton /></div>)}
          </div>
        ) : myCommunities.length === 0 ? (
          <CreateCommunityBanner onClick={() => navigate('/create-community')} t={t} />
        ) : (
          <div
            style={{
              display: 'flex', gap: '12px',
              overflowX: 'auto', scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
              marginLeft: '-10px', marginRight: '-20px',
              paddingLeft: '20px', paddingRight: '20px',
              paddingBottom: '4px', marginBottom: '28px',
            }}
          >
            {sortByRecentVisit(myCommunities).map((community) => {
              // 참가한 커뮤니티 쪽과 같은 기준으로 판정한다. 무조건 달아주면 어드민에서
              // 내려간 사람에게도 관리 버튼이 보이고, 눌러야 서버가 403으로 막는다.
              const isAdmin = (community.admins ?? []).some(a => a.memberId === Number(userId));
              return (
                <CommunityCard
                  key={community.communityId}
                  community={community}
                  onEnter={handleEnterCommunity}
                  onManage={isAdmin ? handleManage : undefined}
                  isCarousel
                  t={t}
                />
              );
            })}
          </div>
        )}

        </>)}

        {/* 코드 입력 모달 */}
        {showJoinInput && (
          <JoinCodeModal
            joinCode={joinCode}
            onCodeChange={(code) => { setJoinCode(code); setJoinError(''); }}
            error={joinError}
            loading={joinLoading}
            onSubmit={handleJoin}
            onClose={() => setShowJoinInput(false)}
            t={t}
          />
        )}

      </div>
      {leavingCommunity && (
        <LeaveConfirmModal
          title={t('community', 'leaveTitle').replace('{name}', leavingCommunity.name)}
          desc={t('community', 'leaveDesc')}
          // 방장 줄은 카드에 방장 여부가 없어 늘 보여 준다 — "방장인 그룹은 …"이라 방장이 아니어도 틀리지 않는다
          items={[t('community', 'leaveGroups'), t('community', 'leaveScores'), t('community', 'leaveHost')]}
          note={t('community', 'leaveAnonymous')}
          cancelText={t('community', 'leaveCancel')}
          confirmText={t('community', 'leaveButton')}
          failText={t('community', 'leaveFailed')}
          onClose={() => setLeavingCommunity(null)}
          onConfirm={async () => {
            await leaveCommunity(leavingCommunity.communityId);
            handleLeft(leavingCommunity);
          }}
        />
      )}
    </div>
  );
};

export default CommunityLobby;
