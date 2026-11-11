import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Share } from '@capacitor/share';
import OnboardingSteps from '../components/shared/OnboardingSteps';
import { deleteCommunity, getCommunityMembers } from '../api/services/communities';
import { EVENTS, logEvent } from '../api/services/events';
import { getAuthUserId } from '../auth/storage';
import { getSelectedCommunity, setSelectedCommunity, removeSelectedCommunity, removeMyCommunity } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import InviteShareCard from '../components/community/InviteShareCard';
import GatheredMembers from '../components/community/GatheredMembers';
import CancelCreationModal from '../components/community/CancelCreationModal';

// 랭킹은 2명부터 의미가 있다. 혼자서는 게임방을 만들어도 기록할 게 없다.
const MIN_PLAYERS = 2;

// 커뮤니티를 만든 직후의 화면. 만든 사람이 친구를 불러 모으고, 모이면 첫 게임방으로 넘어간다.
const InviteFriends = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const userId = getAuthUserId();
  const [community] = useState(() => getSelectedCommunity());
  const communityId = community?.communityId ?? null;
  const inviteCode = community?.inviteCode ?? null;
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState(() => new Set());
  const [newcomerName, setNewcomerName] = useState(null);
  const knownIds = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // 실시간 감지는 하지 않는다. 공유하러 다른 앱에 다녀오면 다시 불러오고, 나머지는 새로고침 버튼으로.
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => getCommunityMembers(communityId),
    enabled: !!communityId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  // 아직 한 번도 못 받았으면 "0명·빈자리 2개"로 그리지 않는다 — 만든 사람은 항상 멤버라 0명은 틀린 숫자다
  const loaded = data !== undefined;
  const members = data ?? [];

  // 처음 불러온 멤버는 원래 있던 사람이다. 그 뒤에 늘어난 사람만 "들어왔다"고 보여준다.
  useEffect(() => {
    if (!data) return;
    const ids = data.map(m => m.memberId);
    if (knownIds.current === null) {
      if (ids.length > 0) knownIds.current = new Set(ids);
      return;
    }
    const added = data.filter(m => !knownIds.current.has(m.memberId));
    if (added.length === 0) return;
    knownIds.current = new Set(ids);
    setNewMemberIds(new Set(added.map(m => m.memberId)));
    setNewcomerName(added[added.length - 1].nickname);
  }, [data]);

  if (!community) return <Navigate to="/community" replace />;

  const joinUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${inviteCode}`;
  const canCreateRoom = members.length >= MIN_PLAYERS;

  // 로비 헤더의 인원 수는 선택 커뮤니티에 저장된 값을 읽는다 — 만든 직후의 1명으로 남지 않게 갱신한다
  const leave = (path, state) => {
    if (members.length > 0) setSelectedCommunity({ ...community, memberCount: members.length });
    navigate(path, { replace: true, state });
  };

  // 응답이 너무 빠르면 아이콘이 돌다 만 것처럼 보여 눌렸는지조차 모른다 — 최소 한 바퀴는 돌린다
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), new Promise(r => setTimeout(r, 800))]);
    setRefreshing(false);
  };

  // 취소 = 방금 만든 모임을 없던 일로. CommunitySettings의 삭제와 같은 정리를 한다.
  const cancelCreation = async () => {
    setIsCanceling(true);
    setCancelError('');
    try {
      await deleteCommunity(communityId);
      removeMyCommunity();
      removeSelectedCommunity();
      queryClient.removeQueries({ queryKey: ['myCommunitiesList'] });
      queryClient.removeQueries({ queryKey: ['communityRooms'] });
      navigate('/community', { replace: true });
    } catch {
      setCancelError(t('community', 'deleteFailed'));
      setIsCanceling(false);
    }
  };

  const flash = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Invite.jsx의 nativeShare와 같은 규칙: 계측을 분기보다 먼저, 공유 시트가 없으면 클립보드로.
  const shareLink = async () => {
    logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'invite_link', source: 'onboarding' } });
    const text = `${t('community', 'onboardShareText').replace('{name}', community.name)}\n${joinUrl}`;

    let canShare = false;
    try { canShare = (await Share.canShare()).value; } catch { canShare = false; }

    if (canShare) {
      await Share.share({ title: community.name, text }).catch(() => {});
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      flash(setLinkCopied);
    } catch {
      alert(t('invite', 'shareUnavailable'));
    }
  };

  const copyCode = async () => {
    logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'invite_code', source: 'onboarding' } });
    try {
      await navigator.clipboard.writeText(inviteCode);
      flash(setCodeCopied);
    } catch {
      alert(t('invite', 'shareUnavailable'));
    }
  };

  return (
    // 하단 고정 버튼 높이만큼 비워둔다 — 안 그러면 멤버 카드 끝이 버튼 밑에 깔린다
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <button
            onClick={() => { setCancelError(''); setShowCancelModal(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '14px', fontWeight: '600', color: V('--th-text-sub'), flexShrink: 0 }}
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={() => leave('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '14px', fontWeight: '600', color: V('--th-text-sub'), flexShrink: 0 }}
          >
            {t('community', 'onboardSkip')}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 0' }}>

        <OnboardingSteps current={canCreateRoom ? 2 : 1} t={t} />

        <p style={{ fontSize: '24px', fontWeight: '800', color: V('--th-text'), margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          {t('community', canCreateRoom ? 'onboardReadyTitle' : 'onboardTitle')}
        </p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('community', canCreateRoom ? 'onboardReadyDesc' : 'onboardDesc')}
        </p>

        {/* QR + 코드 + 공유 */}
        {inviteCode && (
          <InviteShareCard
            joinUrl={joinUrl}
            inviteCode={inviteCode}
            codeCopied={codeCopied}
            linkCopied={linkCopied}
            onCopyCode={copyCode}
            onShare={shareLink}
            t={t}
          />
        )}

        <GatheredMembers
          members={members}
          loaded={loaded}
          minPlayers={MIN_PLAYERS}
          userId={userId}
          newMemberIds={newMemberIds}
          newcomerName={newcomerName}
          spinning={refreshing || isFetching}
          onRefresh={refresh}
          t={t}
        />

      </div>

      {/* 첫 게임방 — 이 화면의 목적지라 스크롤 없이 항상 보이게 하단에 고정한다.
          CreateGroup의 방 만들기 버튼처럼 바 없이 버튼만 띄워 아래 내용을 덜 가린다 */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => leave('/create-group', { fromOnboarding: true })}
            disabled={!canCreateRoom}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              cursor: canCreateRoom ? 'pointer' : 'not-allowed',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: '16px', fontWeight: '700',
              opacity: canCreateRoom ? 1 : 0.4,
              boxShadow: canCreateRoom ? '0 4px 16px rgba(107,92,231,0.35)' : 'none',
            }}
          >
            {t('community', 'onboardCreateRoom')}
          </button>
        </div>
      </div>

      {showCancelModal && (
        <CancelCreationModal
          hasFriends={members.length > 1}
          error={cancelError}
          isCanceling={isCanceling}
          onKeep={() => setShowCancelModal(false)}
          onConfirm={cancelCreation}
          t={t}
        />
      )}
    </div>
  );
};

export default InviteFriends;
