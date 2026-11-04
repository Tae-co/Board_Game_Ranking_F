import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { disbandParty, handOverRecorder, kickPartyMember, leaveParty } from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';
import { CURRENT_PARTY_KEY, useCurrentParty } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import MemberDiceAvatar from '../components/shared/MemberDiceAvatar';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { ConfirmDialog } from '../components/store/StorePopup';
import { fmt } from '../components/store/fmt';
import { card, meBadge, recorderBadge } from '../components/store/storeStyles';
import { useGoBack } from '../hooks/useGoBack';

const GREY = '#9CA3AF';

/**
 * 오늘의 그룹 관리 (시안 2i). 코드 · 그룹 목록(기록자로 / 내보내기) · 나가기 · 해산. 각각 확인창.
 * 게임 중엔 모두 잠긴다. 체크인 만료로 빠진 사람은 위쪽 안내 줄
 */
const StorePartyManage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const { data: party, isLoading } = useCurrentParty();
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isLoading && !party) return <Navigate to={`/store/${storeId}`} replace />;
  if (!party) return null;

  const playing = !!party.currentMatch;
  const iAmRecorder = party.recorderMemberId === myId;
  const successor = party.members.find(m => m.memberId !== myId);

  const texts = dialog && {
    kick: [fmt(t('store', 'kickTitle'), { name: dialog.name }), t('store', 'kickDesc'), t('store', 'kick')],
    hand: [fmt(t('store', 'handTitle'), { name: dialog.name }), fmt(t('store', 'handDesc'), { name: dialog.name }), t('store', 'handAction')],
    leave: [t('store', 'leaveGroupTitle'),
      t('store', 'leaveGroupDesc') + (iAmRecorder && successor ? fmt(t('store', 'leaveGroupRecorder'), { name: successor.nickname }) : ''),
      t('store', 'leaveAction')],
    disband: [t('store', 'disbandTitle'), t('store', 'disbandDesc'), t('store', 'disbandAction')],
  }[dialog.kind];

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      if (dialog.kind === 'kick') await kickPartyMember(dialog.memberId);
      else if (dialog.kind === 'hand') await handOverRecorder(dialog.memberId);
      else if (dialog.kind === 'leave') await leaveParty();
      else await disbandParty();
      await queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
      queryClient.invalidateQueries({ queryKey: ['store', Number(storeId), 'home'] });
      if (dialog.kind === 'leave' || dialog.kind === 'disband') navigate(`/store/${storeId}`, { replace: true });
      setDialog(null);
    } catch {
      setError(t('store', 'actionFailed'));
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const ask = (d) => { if (!playing) setDialog(d); };
  const smallButton = (color) => ({
    height: 36, padding: '0 12px', borderRadius: 999, cursor: playing ? 'default' : 'pointer',
    border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: playing ? GREY : color, fontSize: '13px', fontWeight: 700,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'partyTitle')} onBack={() => goBack(`/store/${storeId}`)} backLabel={t('common', 'back')} />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 170px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {party.expiredNicknames.length > 0 && (
          <section style={{ backgroundColor: V('--th-bg-deep'), borderRadius: '14px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
            {fmt(t('store', 'expiredNotice'), { names: party.expiredNicknames.join(', ') })}
          </section>
        )}
        {playing && (
          <section style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#9A3412' }}>{fmt(t('store', 'playingNotice'), { game: party.currentMatch.gameName })}</span>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7C2D12' }}>{t('store', 'playingNoticeDesc')}</span>
          </section>
        )}
        {error && <span role="alert" style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>}
        <section style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'codeTitle')}</span>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'codeDesc')}</span>
          </span>
          <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.16em', color: V('--th-primary') }}>{party.code}</span>
        </section>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'groupHeading')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'peopleCount'), { n: party.members.length })}</span>
          </div>
          <div style={{ ...card, padding: '4px 16px' }}>
            {party.members.map((m, i) => {
              const me = m.memberId === myId;
              return (
                <div key={m.memberId} style={{ height: 56, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                  <MemberDiceAvatar memberId={m.memberId} nickname={m.nickname} size={32} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nickname}</span>
                    {m.recorder && <span style={recorderBadge}>{t('store', 'recorderBadge')}</span>}
                    {me && <span style={meBadge}>{t('store', 'meBadge')}</span>}
                  </span>
                  {iAmRecorder && !me && (
                    <button onClick={() => ask({ kind: 'hand', memberId: m.memberId, name: m.nickname })} aria-disabled={playing} style={smallButton(V('--th-primary'))}>
                      {t('store', 'toRecorder')}
                    </button>
                  )}
                  {!me && (
                    <button onClick={() => ask({ kind: 'kick', memberId: m.memberId, name: m.nickname })} aria-disabled={playing} style={smallButton('#B91C1C')}>
                      {t('store', 'kick')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <StoreFixedBottom>
        <button onClick={() => ask({ kind: 'leave' })} aria-disabled={playing} style={{
          height: 52, borderRadius: '14px', cursor: playing ? 'default' : 'pointer', border: `1px solid ${V('--th-border')}`,
          backgroundColor: V('--th-card'), color: playing ? GREY : V('--th-text'), fontSize: '16px', fontWeight: 700,
        }}>{t('store', 'leaveGroup')}</button>
        <button onClick={() => ask({ kind: 'disband' })} aria-disabled={playing} style={{
          height: 44, border: 'none', borderRadius: '14px', background: 'none', cursor: playing ? 'default' : 'pointer',
          color: playing ? GREY : '#B91C1C', fontSize: '15px', fontWeight: 700,
        }}>{t('store', 'disband')}</button>
      </StoreFixedBottom>
      {dialog && (
        <ConfirmDialog
          title={texts[0]}
          body={texts[1]}
          cancelLabel={t('store', 'cancel')}
          actionLabel={texts[2]}
          danger={dialog.kind !== 'hand'}
          busy={busy}
          onCancel={() => setDialog(null)}
          onAction={run}
        />
      )}
    </div>
  );
};

export default StorePartyManage;
