import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { card, ghostButton, primaryButton, sectionTitle } from '../store/storeStyles';
import StoreFixedBottom from '../store/StoreFixedBottom';
import ContestStandings from './ContestStandings';
import { PILL, contestWhen, pill } from './contestUtils';

const ROUND_TEXT = {
  DONE: ['roundStaffDone', '#2F6B4C'],
  PLAYING: ['roundPlaying', '#B4500A'],
  AWAITING_CONFIRM: ['roundConfirming', '#B4500A'],
  DISPUTED: ['roundDisputed', '#B4500A'],
  AWAITING_STAFF: ['roundAwaitingStaff', '#B4500A'],
  WAITING: ['roundWaiting', '#9CA3AF'],
  CANCELLED: ['roundCancelled', '#9CA3AF'],
};

/** 시작 전·빠짐·취소 안내 (시안 5b phase) */
const banner = (c) => {
  if (c.status === 'CANCELLED') {
    if (c.endReason === 'DAY_OVER') return ['badgeCancelled', PILL.red, 'dayOverTitle', 'dayOverBody'];
    if (c.endReason === 'STORE_CLOSED') return ['badgeCancelled', PILL.red, 'cancelledTitle', 'storeClosedBody'];
    return ['badgeCancelled', PILL.red, 'cancelledTitle', 'cancelledBody'];
  }
  if (c.status === 'RECRUITING') {
    return c.myArrived ? ['badgeBefore', PILL.orange, 'arrivedTitle', 'arrivedBody'] : ['badgeBefore', PILL.orange, 'waitingTitle', 'waitingBody'];
  }
  if (c.myStatus === 'EXCLUDED') return [null, PILL.gray, 'excludedTitle', 'excludedBody'];
  if (c.myStatus === 'LEFT') return [null, PILL.gray, 'leftTitle', 'leftBody'];
  return null;
};

/** 같은 순위 점수인 바로 옆 사람과 비교 (시안 5b "2위와 순위 점수 같음 · 게임 점수 1 앞섬") */
const tieLine = (standings, me, t) => {
  const ranked = standings.filter(s => !s.left);
  const i = ranked.indexOf(me);
  const other = [ranked[i + 1], ranked[i - 1]].find(s => s && s.total === me.total);
  if (!other) return null;
  const d = Math.round(me.gameScore - other.gameScore);
  const n = other.rank;
  if (d > 0) return fmt(t('contest', 'tieAhead'), { n, d });
  if (d < 0) return fmt(t('contest', 'tieBehind'), { n, d: -d });
  return fmt(t('contest', 'tieSame'), { n });
};

/**
 * 5b 대회 · 진행 중 (+ 시작 전 대기·도착 확인·빠짐·취소 안내).
 * 판이 STAFF 확인으로 반영되면 그 판 순위 점수·현재 순위를 위에 보여 준다
 */
const ContestLive = ({ contest: c, myId, onSheet, onHome, t, lang }) => {
  const done = c.roundStates.filter(r => r.status === 'DONE');
  const live = c.status === 'PLAYING';
  const info = banner(c);
  const me = c.standings.find(s => s.memberId === myId && !s.left);
  const lastDone = done[done.length - 1];
  const current = c.roundStates.find(r => r.matchId === c.currentMatchId);
  const canSheet = live && c.myStatus === 'PLAYING' && c.currentMatchId;
  const badge = info?.[0]
    ? [t('contest', info[0]), info[1]]
    : live ? [fmt(t('contest', 'badgeLiveRounds'), { n: c.rounds, d: done.length }), PILL.green] : null;

  return (
    <>
      <main style={{ boxSizing: 'border-box', padding: '20px 20px 140px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {badge && <span style={pill(badge[1])}>{badge[0]}</span>}
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: V('--th-text') }}>{c.title}</h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'subLine'), { when: contestWhen(c.startsAt, lang), n: live ? c.standings.filter(s => !s.left).length : c.capacity })}
          </span>
        </section>

        {info && (
          <section style={{ ...card, padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>{t('contest', info[2])}</span>
            <span style={{ fontSize: '14px', lineHeight: 1.55, color: V('--th-text-sub') }}>{t('contest', info[3])}</span>
          </section>
        )}

        {live && (
          <>
            {me && lastDone?.myPoints != null && current?.status === 'PLAYING' && (
              <section role="status" style={{ backgroundColor: '#E3F2E9', border: '1px solid #A7D7BC', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F5138' }}>{fmt(t('contest', 'roundDoneTitle'), { n: lastDone.round })}</span>
                <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#2F6B4C' }}>
                  {fmt(t('contest', 'roundDoneBody'), { place: lastDone.myPlacement, pts: lastDone.myPoints, rank: me.rank })}
                </span>
              </section>
            )}

            {me && (
              <section style={{ backgroundColor: V('--th-primary'), color: '#fff', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.85 }}>{t('contest', 'myRecord')}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                  {[
                    ['myRank', fmt(t('contest', 'rankValue'), { n: me.rank })],
                    ['myPoints', fmt(t('contest', 'pointsN'), { n: me.total })],
                    ['myGameScore', Math.round(me.gameScore)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>{t('contest', k)}</span>
                      <span style={{ fontSize: '24px', fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
                {done.length > 0 && tieLine(c.standings, me, t) && <span style={{ fontSize: '13px', opacity: 0.85 }}>{tieLine(c.standings, me, t)}</span>}
              </section>
            )}
          </>
        )}

        {(live || c.myStatus === 'EXCLUDED' || c.myStatus === 'LEFT') && c.standings.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={sectionTitle}>{t('contest', 'standingsTitle')}</h2>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('contest', 'standingsSub')}</span>
            </div>
            <ContestStandings standings={c.standings} rounds={c.rounds} myId={myId} t={t} />
          </section>
        )}

        {live && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={sectionTitle}>{t('contest', 'roundsTitle')}</h2>
            <div style={{ ...card, padding: '4px 16px' }}>
              {c.roundStates.map((r, i) => {
                const [key, color] = ROUND_TEXT[r.status] ?? ROUND_TEXT.WAITING;
                return (
                  <div key={r.round} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{fmt(t('contest', 'roundN'), { n: r.round })}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>{t('contest', key)}</span>
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('contest', 'notRanked')}</span>
          </section>
        )}
      </main>
      <StoreFixedBottom>
        {canSheet ? (
          <button onClick={() => onSheet(c.currentMatchId)} style={primaryButton()}>{fmt(t('contest', 'toSheet'), { n: current?.round ?? '' })}</button>
        ) : (
          <button onClick={onHome} style={ghostButton}>{t('contest', 'toHome')}</button>
        )}
      </StoreFixedBottom>
    </>
  );
};

export default ContestLive;
