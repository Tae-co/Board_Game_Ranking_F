import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Ticket } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import StorageImage from '../components/StorageImage';
import GameImageFallback from '../components/shared/GameImageFallback';
import { CommunityCardSkeleton } from '../components/Skeleton';
import { joinCommunity, getMyCommunities, getJoinedCommunities } from '../api/services/communities';
import { EVENTS, logEvent } from '../api/services/events';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import CommunityCard from '../components/community/CommunityCard';
import { getNickname, getAuthUserId, getRole } from '../auth/storage';
import { enterCommunity, setMyCommunity, removeMyCommunity, sortByRecentVisit } from '../utils/storage';

const DiceLogo = () => (
  <img src="/logo.png" width="28" height="28" style={{ objectFit: 'contain' }} alt="logo" />
);


const CommunityLobby = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const nickname = getNickname() || '?';
  const userId = getAuthUserId();
  const isSystemAdmin = getRole() === 'ADMIN';

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {
    if (showJoinInput) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showJoinInput]);

  const { data: myCommunities = [], isLoading: myLoading, isError: myError, refetch: refetchMy, isFetching: myFetching } = useQuery({
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

  const { data: joinedCommunities = [], isLoading: joinedLoading, isError: joinedError, refetch: refetchJoined, isFetching: joinedFetching } = useQuery({
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
      // 서버는 이미 멤버여도 200을 준다. 원래 있던 모임이면 "들어왔어요"를 띄우지 않는다.
      const alreadyIn = [...joinedCommunities, ...myCommunities].some(c => c.communityId === res.data.communityId);
      // 목록에 남겨두면 참가했는지조차 모른다 — 들어간 모임으로 바로 보낸다
      enterCommunity(res.data, userId);
      navigate('/lobby', { state: { justJoined: !alreadyIn } });
    } catch (e) {
      // 확인 팝업으로 넘어가며 입력창을 닫았다 — 다시 열어야 오류가 보인다. 코드는 남겨 고쳐 쓰게 한다.
      setJoinError(e.response?.data?.message || t('community', 'invalidCode'));
      setJoinCode(pendingJoinCode);
      setShowJoinInput(true);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinCancel = () => {
    setShowJoinConfirm(false);
    setPendingJoinCode('');
  };

  const handleManage = (community) => {
    setMyCommunity(community);
    navigate('/manage-community');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 40 }}>

      {/* 커뮤니티 참가 확인 팝업 */}
      {showJoinConfirm && (
        <div
          onClick={handleJoinCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: V('--th-card'), borderRadius: '20px',
              padding: '28px 24px', width: '100%', maxWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 8px', textAlign: 'center' }}>
              {t('community', 'joinConfirmTitle')}
            </p>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 16px', textAlign: 'center' }}>
              {t('community', 'joinConfirmDesc')}
            </p>
            <div style={{
              backgroundColor: V('--th-bg'), borderRadius: '12px',
              padding: '12px', marginBottom: '24px', textAlign: 'center',
              fontFamily: 'monospace', fontSize: '24px', fontWeight: '800',
              letterSpacing: '0.15em', color: V('--th-primary'),
            }}>
              {pendingJoinCode}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleJoinCancel}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px', border: `1px solid var(--th-border)`,
                  backgroundColor: V('--th-bg'), color: V('--th-text'),
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={handleJoinConfirm}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {t('community', 'joinConfirmButton')}
              </button>
            </div>
          </div>
        </div>
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

        {/* Welcome Banner */}
        <div style={{
          borderRadius: '20px',
          padding: '24px 22px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)' }}/>
          <div style={{ position: 'absolute', right: 30, top: -30, width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}/>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {t('lobby', 'heroGreeting').replace('{name}', nickname)}
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            {t('lobby', 'heroSubLine1')}<br/>{t('lobby', 'heroSubLine2')}
          </p>
        </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: '0 0 2px' }}>
              {t('community', 'firstVisitTitle')}
            </p>
            <button
              onClick={() => navigate('/create-community')}
              style={{
                width: '100%', borderRadius: '18px', padding: '22px 20px',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 4px 16px rgba(107,92,231,0.3)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={22} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: '0 0 4px' }}>{t('community', 'firstVisitCreate')}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{t('community', 'firstVisitCreateDesc')}</p>
              </div>
            </button>
            <button
              onClick={() => { logEvent(EVENTS.COMMUNITY_JOIN_STARTED); setJoinCode(''); setJoinError(''); setShowJoinInput(true); }}
              style={{
                width: '100%', borderRadius: '18px', padding: '22px 20px',
                cursor: 'pointer', textAlign: 'left',
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '14px', backgroundColor: V('--th-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ticket size={22} color="var(--th-primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px' }}>{t('community', 'firstVisitJoin')}</p>
                <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('community', 'firstVisitJoinDesc')}</p>
              </div>
            </button>
          </div>
        ) : (<>
        {/* Joined Communities */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
            {t('community', 'joinedCommunities')}
          </p>
          <button
            onClick={() => { logEvent(EVENTS.COMMUNITY_JOIN_STARTED); setJoinCode(''); setJoinError(''); setShowJoinInput(true); }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(107,92,231,0.3)',
            }}
          >
            <Plus size={16} color="#fff" />
          </button>
        </div>
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
                  t={t}
                />
              );
            })}
          </div>
        )}

        {/* My Community */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
            {t('community', 'myCommunity')}
          </p>
          {myCommunities.length > 0 && (
            <button
              onClick={() => navigate('/create-community')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(107,92,231,0.3)',
              }}
            >
              <Plus size={16} color="#fff" />
            </button>
          )}
        </div>

        {myLoading ? (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, paddingLeft: 10 }}>
            {[0, 1].map(i => <div key={i} style={{ flex: '0 0 calc(100% - 40px)' }}><CommunityCardSkeleton /></div>)}
          </div>
        ) : myCommunities.length === 0 ? (
          <button
            onClick={() => navigate('/create-community')}
            style={{
              width: '100%', borderRadius: '18px', padding: '28px 24px',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
              position: 'relative', overflow: 'hidden', marginBottom: '28px',
              display: 'block',
            }}
          >
            <div style={{ position: 'absolute', right: -10, bottom: -20, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }}/>
            <div style={{ position: 'absolute', right: 40, top: -20, width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}/>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Plus size={18} color="#fff" />
            </div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
              {t('community', 'createCommunity')}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
              {t('community', 'createCommunityDesc')}
            </p>
          </button>
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
          <div
            onClick={() => setShowJoinInput(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: V('--th-card'), borderRadius: '20px',
                padding: '28px 24px', width: '100%', maxWidth: '360px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 6px' }}>
                {t('community', 'joinCommunity')}
              </p>
              <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 20px' }}>
                {t('community', 'enterInviteCode')}
              </p>
              <input
                autoFocus
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="AB12CD"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px', borderRadius: '12px',
                  border: `1px solid ${joinError ? '#ef4444' : 'var(--th-border)'}`,
                  backgroundColor: V('--th-bg'), color: V('--th-text'),
                  fontSize: '20px', fontWeight: '700', letterSpacing: '0.15em',
                  outline: 'none', textAlign: 'center', marginBottom: '8px',
                }}
              />
              {joinError && (
                <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 12px', textAlign: 'center' }}>{joinError}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={joinLoading || !joinCode.trim()}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  marginTop: joinError ? 0 : '12px',
                  cursor: joinLoading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                  background: joinLoading || !joinCode.trim()
                    ? 'var(--th-border)'
                    : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                  color: '#fff', fontSize: '16px', fontWeight: '700',
                }}
              >
                {joinLoading ? '...' : t('community', 'joinWithCodeBtn')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const RoomCard = ({ room, manageLabel, activeLabel, inactiveLabel, onManage }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      backgroundColor: 'var(--th-card)', borderRadius: '14px',
      padding: '14px 16px', border: '1px solid var(--th-border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--th-bg)' }}>
        {room.imageUrl && !imgError ? (
          <StorageImage src={room.imageUrl} alt={room.roomName} onError={() => setImgError(true)} transform={{ width: 104, height: 104, quality: 70 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GameImageFallback size={34} /></div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--th-text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.roomName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            backgroundColor: room.sessionActive ? '#22c55e' : 'var(--th-text-sub)',
          }}/>
          <span style={{ fontSize: '12px', color: 'var(--th-text-sub)', fontWeight: '500' }}>
            {room.sessionActive ? activeLabel : inactiveLabel}
          </span>
        </div>
      </div>
      <button
        onClick={onManage}
        style={{
          fontSize: '12px', fontWeight: '600', color: 'var(--th-text)',
          backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)',
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {manageLabel}
      </button>
    </div>
  );
};

export default CommunityLobby;
