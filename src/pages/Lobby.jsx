import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useQuery } from '@tanstack/react-query';
import { getRoomByInviteCode, getMyRooms, getCommunityRooms } from '../api/services/rooms';
import { getGames } from '../api/services/games';
import { getCommunityMembers } from '../api/services/communities';
import { getAuthUserId, getNickname } from '../auth/storage';
import { useSelectedCommunity } from '../hooks/useSelectedCommunity';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import JoinCodeSheet from '../components/lobby/JoinCodeSheet';
import CommunityHero from '../components/lobby/CommunityHero';
import WelcomeBanner from '../components/shared/WelcomeBanner';
import SeasonEntryCard from '../components/lobby/SeasonEntryCard';
import LobbyActionCard from '../components/lobby/LobbyActionCard';
import RoomGrid from '../components/lobby/RoomGrid';
import CommunityMemberGrid from '../components/lobby/CommunityMemberGrid';
import InviteQrPopup from '../components/lobby/InviteQrPopup';
import { EVENTS, logEvent } from '../api/services/events';

const DiceLogo = () => (
  <img src="/logo.png" width="28" height="28" style={{ objectFit: 'contain' }} alt="logo" />
);

const Lobby = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const sheetRef = useRef(null);
  const nickname = getNickname() || t('lobby', 'defaultNickname');
  const userId = getAuthUserId();
  const { selectedCommunity } = useSelectedCommunity();
  const communityId = selectedCommunity?.communityId ?? null;
  const isAdmin = selectedCommunity?.isAdmin ?? false;
  const communityInviteCode = selectedCommunity?.inviteCode ?? null;
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQrPopup, setShowQrPopup] = useState(false);

  // 초대코드·QR로 막 참가했다면 어디에 들어왔는지 한 번 알려준다.
  // state를 지워두지 않으면 뒤로가기로 돌아올 때마다 다시 뜬다.
  const location = useLocation();
  const [showJoinedToast, setShowJoinedToast] = useState(() => !!location.state?.justJoined);
  useEffect(() => {
    if (!showJoinedToast) return;
    navigate(location.pathname, { replace: true, state: null });
    const timer = setTimeout(() => setShowJoinedToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showJoinedToast]);

  // 초대코드 복사가 초대 퍼널의 진짜 첫 칸이다 — /join 랜딩으로 이어지는 경로는
  // 랭킹 자랑(INVITE_SHARED kind=my_rank)이 아니라 이 코드다. 여기가 비어 있으면
  // 신규 유입이 없을 때 "초대를 안 보낸 건지, 보냈는데 안 연 건지"를 구분할 수 없다.
  const copyInviteCode = async () => {
    if (!communityInviteCode) return;
    logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'invite_code' } });
    // navigator.clipboard는 보안 컨텍스트에서만 존재한다 — 없으면 throw해서
    // "복사됨" 표시조차 안 뜨고 사용자는 왜 안 되는지 알 수 없다.
    try {
      await navigator.clipboard.writeText(communityInviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      alert(t('invite', 'shareUnavailable'));
    }
  };

  const { data: rooms = [] } = useQuery({
    queryKey: communityId ? ['communityRooms', communityId, userId] : ['rooms', userId],
    queryFn: async () => {
      if (!userId || userId === 'null') return [];
      if (communityId) return getCommunityRooms(communityId, userId);
      return getMyRooms(userId);
    },
    enabled: !!userId && userId !== 'null',
    staleTime: 1000 * 60 * 2,
  });

  const { data: games = [] } = useQuery({
    // queryFn에 함수를 그대로 넘기면 react-query 컨텍스트가 communityId 자리로 들어가
    // /games?communityId[client]=[object Object] 같은 요청이 나간다.
    // 이 쿼리는 커뮤니티 미선택일 때만 돈다(방 카드에 게임 사진을 쓸 때) — 그때 communityId는 null이다.
    queryKey: ['games', communityId],
    queryFn: () => getGames(communityId),
    enabled: !communityId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: communityMembers = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => getCommunityMembers(communityId),
    enabled: !!communityId,
    staleTime: 1000 * 30,
  });

  // 참가는 방 화면의 참가하기 버튼에서 한다. 여기서는 들어가기만 한다.
  const handleEnterRoom = (room) => {
    navigate(`/invite/${room.roomId}`);
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const room = await getRoomByInviteCode(joinCode.trim());
      setJoinCode('');
      setShowJoinSheet(false);
      navigate(`/invite/${room.roomId}`);
    } catch {
      alert(t('lobby', 'joinFailed'));
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!showJoinSheet) return;
    const handle = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) setShowJoinSheet(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showJoinSheet]);

  useEffect(() => {
    if (!showJoinSheet) return;
    const handle = (e) => { if (e.key === 'Escape') setShowJoinSheet(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [showJoinSheet]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>

      {showJoinedToast && selectedCommunity && (
        <div
          onClick={() => setShowJoinedToast(false)}
          style={{
            position: 'fixed', left: 16, right: 16, zIndex: 300,
            top: 'calc(env(safe-area-inset-top) + 72px)',
            maxWidth: 358, margin: '0 auto',
            padding: '14px 16px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', boxShadow: '0 8px 24px rgba(107,92,231,0.35)',
          }}
        >
          <p style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 3px' }}>
            {t('lobby', 'joinedToastTitle').replace('{name}', selectedCommunity.name)}
          </p>
          <p style={{ fontSize: '12px', margin: 0, opacity: 0.85 }}>
            {t('lobby', 'joinedToastDesc')}
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
      <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
        {selectedCommunity ? (
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={22} color="var(--th-primary)" />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              {selectedCommunity.name}
            </span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiceLogo />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              Yada Rank
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--th-text-sub)' }}>
              {t('lobby', 'adminBadge')}
            </span>
          )}
          <NavAvatar />
        </div>
      </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 24px' }}>

        {communityId ? (
          <CommunityHero
            community={selectedCommunity}
            inviteCode={communityInviteCode}
            codeCopied={codeCopied}
            onShowQr={() => setShowQrPopup(true)}
            onCopy={copyInviteCode}
            t={t}
          />
        ) : (
          <WelcomeBanner nickname={nickname} t={t} />
        )}

        {communityId && <SeasonEntryCard onClick={() => navigate('/season')} t={t} />}

        {/* Action Buttons — 커뮤니티 모드에서는 숨김 */}
        {!communityId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <LobbyActionCard
              icon={<Plus style={{ color: V('--th-text'), width: 18, height: 18 }} />}
              title={t('lobby', 'createGroup')}
              desc={t('lobby', 'createGroupDesc')}
              onClick={() => navigate('/create-group')}
            />
            <LobbyActionCard
              icon={<Users style={{ color: V('--th-text'), width: 18, height: 18 }} />}
              title={t('lobby', 'joinWithCode')}
              desc={t('lobby', 'joinWithCodeDesc')}
              onClick={() => { setJoinCode(''); setShowJoinSheet(true); }}
            />
          </div>
        )}

        {/* My Groups / Community Groups */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: 0 }}>
              {communityId ? t('community', 'communityGroups') : t('lobby', 'myGroups')}
            </p>
            {/* 커뮤니티 모드 + Admin: 그룹 생성 버튼 */}
            {communityId && isAdmin && (
              <button
                onClick={() => navigate('/create-group')}
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

          <RoomGrid rooms={rooms} games={games} communityId={communityId} onEnter={handleEnterRoom} t={t} />
        </div>

        {communityId && (
          <CommunityMemberGrid
            members={communityMembers}
            userId={userId}
            isAdmin={isAdmin}
            onManage={() => navigate('/community-members')}
            t={t}
          />
        )}
      </div>

      {showQrPopup && communityInviteCode && (
        <InviteQrPopup
          inviteCode={communityInviteCode}
          codeCopied={codeCopied}
          onCopy={copyInviteCode}
          onClose={() => setShowQrPopup(false)}
          t={t}
        />
      )}

      {showJoinSheet && (
        <JoinCodeSheet
          sheetRef={sheetRef}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          isJoining={isJoining}
          onJoin={handleJoinRoom}
          t={t}
        />
      )}
    </div>
  );
};

export default Lobby;
