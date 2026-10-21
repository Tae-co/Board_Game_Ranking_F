import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Share } from '@capacitor/share';
import { QRCodeSVG } from 'qrcode.react';
import { Check, CheckCheck, Copy, RefreshCw, Share2 } from 'lucide-react';
import InitialAvatar from '../components/shared/InitialAvatar';
import { getCommunityMembers } from '../api/services/communities';
import { EVENTS, logEvent } from '../api/services/events';
import { getAuthUserId } from '../auth/storage';
import { getSelectedCommunity, setSelectedCommunity } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

const AVATAR_COLORS = ['#6B5CE7', '#F5A623', '#22c55e', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
// 랭킹은 2명부터 의미가 있다. 혼자서는 게임방을 만들어도 기록할 게 없다.
const MIN_PLAYERS = 2;

// 커뮤니티를 만든 직후의 화면. 만든 사람이 친구를 불러 모으고, 모이면 첫 게임방으로 넘어간다.
const InviteFriends = () => {
  const navigate = useNavigate();
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

  // 실시간 감지는 하지 않는다. 공유하러 다른 앱에 다녀오면 다시 불러오고, 나머지는 새로고침 버튼으로.
  const { data: members = [], refetch, isFetching } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => getCommunityMembers(communityId),
    enabled: !!communityId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 처음 불러온 멤버는 원래 있던 사람이다. 그 뒤에 늘어난 사람만 "들어왔다"고 보여준다.
  useEffect(() => {
    const ids = members.map(m => m.memberId);
    if (knownIds.current === null) {
      if (ids.length > 0) knownIds.current = new Set(ids);
      return;
    }
    const added = members.filter(m => !knownIds.current.has(m.memberId));
    if (added.length === 0) return;
    knownIds.current = new Set(ids);
    setNewMemberIds(new Set(added.map(m => m.memberId)));
    setNewcomerName(added[added.length - 1].nickname);
  }, [members]);

  if (!community) return <Navigate to="/community" replace />;

  const joinUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${inviteCode}`;
  const canCreateRoom = members.length >= MIN_PLAYERS;

  // 로비 헤더의 인원 수는 선택 커뮤니티에 저장된 값을 읽는다 — 만든 직후의 1명으로 남지 않게 갱신한다
  const leave = (path) => {
    if (members.length > 0) setSelectedCommunity({ ...community, memberCount: members.length });
    navigate(path, { replace: true });
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

  const steps = [
    { label: t('community', 'onboardStepCreate'), done: true },
    { label: t('community', 'onboardStepInvite'), done: canCreateRoom },
    { label: t('community', 'onboardStepRoom'), done: false },
  ];
  const currentStep = steps.findIndex(s => !s.done);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <span style={{ fontSize: '17px', fontWeight: '700', color: V('--th-primary'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {community.name}
          </span>
          <button
            onClick={() => leave('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '14px', fontWeight: '600', color: V('--th-text-sub'), flexShrink: 0 }}
          >
            {t('community', 'onboardSkip')}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* 단계 표시 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {steps.map((step, i) => {
            const isCurrent = i === currentStep;
            return (
              <div key={step.label} style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  height: 4, borderRadius: 2, marginBottom: 8,
                  backgroundColor: step.done || isCurrent ? V('--th-primary') : V('--th-border'),
                  opacity: isCurrent ? 0.45 : 1,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {step.done && <Check size={12} color="var(--th-primary)" strokeWidth={3} />}
                  <span style={{
                    fontSize: '11px', fontWeight: isCurrent ? '800' : '600',
                    color: step.done || isCurrent ? V('--th-text') : V('--th-text-sub'),
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '24px', fontWeight: '800', color: V('--th-text'), margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          {t('community', 'onboardTitle')}
        </p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('community', 'onboardDesc')}
        </p>

        {/* QR + 코드 + 공유 */}
        {inviteCode && (
          <div style={{
            backgroundColor: V('--th-card'), borderRadius: '20px',
            border: `1px solid var(--th-border)`, padding: '24px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#fff' }}>
              <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#1a1a2e" />
            </div>
            <button
              onClick={copyCode}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '800', letterSpacing: '0.2em', color: V('--th-primary') }}>
                {inviteCode}
              </span>
              {codeCopied
                ? <CheckCheck size={18} color="#22c55e" />
                : <Copy size={18} color="var(--th-text-sub)" />
              }
            </button>
            <button
              onClick={shareLink}
              style={{
                width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: '16px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {linkCopied ? <CheckCheck size={18} /> : <Share2 size={18} />}
              {linkCopied ? t('community', 'onboardLinkCopied') : t('community', 'onboardShare')}
            </button>
          </div>
        )}

        {/* 모인 사람 */}
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          border: `1px solid var(--th-border)`, padding: '18px 20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text'), margin: 0 }}>
              {t('community', 'onboardMembers').replace('{n}', members.length)}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label={t('community', 'onboardRefresh')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw
                size={18}
                color="var(--th-text-sub)"
                style={{ animation: isFetching ? 'spin 0.8s linear infinite' : 'none' }}
              />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px 6px' }}>
            {members.map((member) => {
              const isMe = String(member.memberId) === String(userId);
              return (
                <div key={member.memberId} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: 0,
                  animation: newMemberIds.has(member.memberId) ? 'member-pop 0.5s ease-out' : 'none',
                }}>
                  <InitialAvatar
                    nickname={member.nickname}
                    profileImage={member.profileImage}
                    size={44}
                    fontSize={17}
                    color={AVATAR_COLORS[member.memberId % AVATAR_COLORS.length]}
                  />
                  <span style={{
                    fontSize: '10px', fontWeight: isMe ? '700' : '500',
                    color: isMe ? V('--th-primary') : V('--th-text'),
                    textAlign: 'center', width: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {member.nickname}
                  </span>
                </div>
              );
            })}
            {/* 빈자리: 몇 명이 더 와야 하는지 보이게 한다 */}
            {Array.from({ length: Math.max(0, MIN_PLAYERS - members.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', boxSizing: 'border-box',
                  border: `2px dashed var(--th-border)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, fontWeight: 700, color: V('--th-text-sub'),
                }}>
                  ?
                </div>
                <span style={{ fontSize: '10px', color: V('--th-text-sub') }}>{t('community', 'onboardEmptySeat')}</span>
              </div>
            ))}
          </div>

          {newcomerName && (
            <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-primary'), margin: '14px 0 0', textAlign: 'center' }}>
              {t('community', 'onboardNewMember').replace('{name}', newcomerName)}
            </p>
          )}
        </div>

        {/* 첫 게임방 */}
        <button
          onClick={() => leave('/create-group')}
          disabled={!canCreateRoom}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            cursor: canCreateRoom ? 'pointer' : 'not-allowed',
            background: canCreateRoom ? 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)' : 'var(--th-border)',
            color: '#fff', fontSize: '16px', fontWeight: '700',
            boxShadow: canCreateRoom ? '0 4px 16px rgba(107,92,231,0.35)' : 'none',
          }}
        >
          {t('community', 'onboardCreateRoom')}
        </button>
        {!canCreateRoom && (
          <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: '10px 0 0', textAlign: 'center' }}>
            {t('community', 'onboardNeedFriend')}
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteFriends;
