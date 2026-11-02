import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createParty, getStoreRoom, getStoreRoomMatches, startStoreMatch, storeErrorCode } from '../api/services/stores';
import { getAuthUserId, getNickname } from '../auth/storage';
import { CURRENT_PARTY_KEY, useAutoEnterMatch, useCurrentParty } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StorageImage from '../components/StorageImage';
import GameImageFallback from '../components/shared/GameImageFallback';
import StoreRankRow from '../components/store/StoreRankRow';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { fmt, num } from '../components/store/fmt';
import { card, hintText, primaryButton } from '../components/store/storeStyles';
import { Skeleton } from '../components/Skeleton';

const blockText = (start, game, room, t) => {
  const p = start.party;
  switch (start.block) {
    case 'PLAYER_COUNT': return fmt(t('store', 'blockPlayerCount'), { game: game.name, min: game.minPlayers, max: game.maxPlayers, n: p?.size });
    case 'PARTY_PLAYING': return fmt(t('store', 'blockBusy'), { game: start.busyGameName });
    case 'STORE_NOT_OPEN': return fmt(t('store', 'blockNotOpen'), { open: room.openTime, close: room.closeTime });
    case 'TOO_CLOSE_TO_CLOSING': return fmt(t('store', 'blockTooLate'), {
      close: room.closeTime, game: game.name, min: game.minMinutes,
      left: Math.max(0, Math.floor((new Date(start.closesAt) - Date.now()) / 60000)),
    });
    case 'ROOM_CLOSED': return fmt(t('store', 'blockRoomClosed'), { game: game.name });
    case 'GAME_TIME_NOT_SET': return t('store', 'blockTimeNotSet');
    case 'NOT_CHECKED_IN': return t('store', 'blockNotCheckedIn');
    case 'MEMBER_NOT_CHECKED_IN': return t('store', 'blockMemberNotCheckedIn');
    case 'STORE_CLOSED': return t('store', 'blockStoreClosed');
    default: return '';
  }
};

const MatchList = ({ storeId, roomId, t }) => {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['store', 'room', Number(roomId), 'matches'],
    queryFn: () => getStoreRoomMatches(storeId, roomId),
  });
  if (isLoading) return <Skeleton height={120} radius={20} />;
  if (matches.length === 0) return <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'noMatches')}</p>;
  return matches.map(m => (
    <section key={m.id} style={{ ...card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{new Date(m.endedAt).toLocaleString()}</span>
      {m.participants.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: V('--th-text') }}>
          <span style={{ width: 32, fontWeight: 700, color: p.placement === 1 ? V('--th-primary') : V('--th-text-sub') }}>{fmt(t('store', 'placeN'), { n: p.placement })}</span>
          <span style={{ flex: 1 }}>{p.nickname ?? t('store', 'leftMember')}</span>
          {p.gameScore != null && <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{num(p.gameScore)}</span>}
          {p.ratingChange != null && (
            <span style={{ width: 44, textAlign: 'right', fontWeight: 700, color: p.ratingChange > 0 ? '#2F6B4C' : V('--th-text-sub') }}>
              {p.ratingChange > 0 ? `+${p.ratingChange}` : p.ratingChange}
            </span>
          )}
        </div>
      ))}
    </section>
  ));
};

/**
 * 매장 게임방 (시안 3). 매장 랭킹 / 매치기록 탭 (시즌 탭은 시즌이 생기는 4단계). 아래는 시작 버튼 상태:
 * 기록자면 "그룹 N명으로 게임 시작", 아니면 회색 "[기록자]님이 게임을 고르는 중", 막히면 이유, 그룹 없으면 만들기/합류
 */
const StoreRoom = () => {
  const { storeId, roomId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const [tab, setTab] = useState('ranking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const { data: party } = useCurrentParty();
  useAutoEnterMatch(party, myId, navigate);

  const { data: room, refetch } = useQuery({
    queryKey: ['store', 'room', Number(roomId)],
    queryFn: () => getStoreRoom(storeId, roomId),
    refetchInterval: 1000 * 30,
  });

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const match = await startStoreMatch(storeId, roomId);
      queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
      navigate(`/store/match/${match.id}`, { replace: true });
    } catch (e) {
      setError(storeErrorCode(e) ? e.response.data.message : t('store', 'actionFailed'));
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      await createParty(storeId);
      await queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
      navigate(`/store/${storeId}/party`);
    } catch (e) {
      setError(storeErrorCode(e) === 'NOT_CHECKED_IN' ? t('store', 'blockNotCheckedIn') : t('store', 'actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const game = room?.game;
  const st = room?.start;
  const recorderName = st?.party?.recorderNickname;
  const others = st?.party?.nicknames.filter(n => n !== getNickname()) ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top)', backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}` }}>
        <div style={{ maxWidth: 430, margin: '0 auto', height: 70, boxSizing: 'border-box', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(`/store/${storeId}`)} aria-label={t('common', 'back')} style={{ width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', color: V('--th-primary'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
          <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: V('--th-primary') }}>
            <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)` }}>{t('store', 'storeBadge')}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {room ? `${[room.store.name, room.store.branch].filter(Boolean).join(' ')} · ${game.name}` : ''}
            </span>
          </span>
          <button onClick={() => navigate('/profile')} aria-label="profile" style={{ width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700 }}>
            {(getNickname() || '?')[0]}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 200px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {!room ? <Skeleton height={220} radius={24} /> : (
          <section style={{ position: 'relative', height: 220, borderRadius: '24px', overflow: 'hidden', backgroundColor: V('--th-bg-deep'), border: `2px solid rgba(${V('--th-primary-rgb')}, 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {game.imageUrl && !imgError
              ? <StorageImage src={game.imageUrl} alt={game.name} onError={() => setImgError(true)} transform={{ width: 780, height: 440, quality: 70 }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <GameImageFallback size={56} />}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 18px', background: 'linear-gradient(transparent, rgba(17,24,39,0.72))', color: '#fff', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '26px', fontWeight: 700 }}>{game.name}</span>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>
                {fmt(t('store', 'roomSub'), { min: game.minPlayers, max: game.maxPlayers, a: game.minMinutes ?? '-', b: game.maxMinutes ?? '-' })}
              </span>
            </div>
          </section>
        )}

        <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: 999 }}>
          {['ranking', 'matches'].map(k => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, height: 40, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: '14px',
              fontWeight: tab === k ? 700 : 500, backgroundColor: tab === k ? V('--th-primary') : 'transparent',
              color: tab === k ? '#fff' : V('--th-text-sub'),
            }}>{t('store', k === 'ranking' ? 'tabRanking' : 'tabMatches')}</button>
          ))}
        </div>

        {tab === 'ranking' && room && (
          <>
            {room.ranking.length === 0 ? (
              <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'noRankingYet')}</p>
            ) : (
              <section style={{ ...card, padding: '4px 16px' }}>
                {room.ranking.map((item, i) => <StoreRankRow key={item.memberId} item={item} first={i === 0} meLabel={t('store', 'meBadge')} />)}
              </section>
            )}
            {room.ranking.length > 0 && (
              <button onClick={() => navigate(`/store/${storeId}/rooms/${roomId}/ranking`)} style={{
                height: 48, borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
                color: V('--th-primary'), fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                {t('store', 'moreWithPlayers')}
                <span style={{ fontWeight: 500, color: V('--th-text-sub') }}>{fmt(t('store', 'playersSuffix'), { n: game.playerCount })}</span>
              </button>
            )}
          </>
        )}
        {tab === 'matches' && <MatchList storeId={storeId} roomId={roomId} t={t} />}
      </main>

      {st && (
        <StoreFixedBottom>
          {st.expiredNicknames.length > 0 && (
            <span style={{ fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub'), backgroundColor: V('--th-bg-deep'), borderRadius: '10px', padding: '8px 10px' }}>
              {fmt(t('store', 'expiredNotice'), { names: st.expiredNicknames.join(', ') })}
            </span>
          )}
          {st.party && st.block !== 'STAFF' && (
            <button onClick={() => navigate(`/store/${storeId}/party/manage`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: V('--th-text-sub'), fontSize: '13px' }}>
              <span>
                <b style={{ color: V('--th-text') }}>{fmt(t('store', 'partyLine'), { n: st.party.size })}</b>
                {others.length > 0 && ` · ${others.join('·')}`}
              </span>
              <span style={{ color: V('--th-primary'), fontWeight: 700 }}>{t('store', 'partyLineManage')}</span>
            </button>
          )}
          {st.block === null && (
            <>
              <button onClick={start} disabled={busy} style={{ ...primaryButton(!busy) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M7 5l12 7-12 7z" /></svg>
                {fmt(t('store', 'startWith'), { n: st.party.size })}
              </button>
              <span style={hintText}>{t('store', 'startHint')}</span>
            </>
          )}
          {st.block === 'NOT_RECORDER' && (
            <>
              <button disabled style={primaryButton(false)}>{fmt(t('store', 'recorderChoosing'), { name: recorderName })}</button>
              <span style={hintText}>{t('store', 'recorderChoosingHint')}</span>
            </>
          )}
          {st.block === 'NO_PARTY' && (
            <>
              <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'needPartyTitle')}</span>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'needPartyDesc')}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={create} disabled={busy} style={{ flex: 1, height: 48, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '15px', fontWeight: 700 }}>{t('store', 'partyCreate')}</button>
                <button onClick={() => navigate(`/store/${storeId}/party/join`)} style={{ flex: 1, height: 48, borderRadius: '14px', cursor: 'pointer', border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '15px', fontWeight: 700 }}>{t('store', 'codeJoinShort')}</button>
              </div>
            </>
          )}
          {st.block === 'STAFF' && <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', 'staffNoPlay')}</span>}
          {st.block && !['NOT_RECORDER', 'NO_PARTY', 'STAFF'].includes(st.block) && (
            <>
              <button disabled style={primaryButton(false)}>{t('store', 'startDisabled')}</button>
              <span role="status" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{blockText(st, game, room, t)}</span>
            </>
          )}
          {error && <span role="alert" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>}
        </StoreFixedBottom>
      )}
    </div>
  );
};

export default StoreRoom;
