import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { card, meBadge, primaryButton, sectionTitle } from '../store/storeStyles';
import StoreFixedBottom from '../store/StoreFixedBottom';
import ContestStandings from './ContestStandings';
import { PILL, contestWhen, pill } from './contestUtils';

const PODIUM = [
  { place: 1, h: 104, size: 52 },
  { place: 2, h: 72, size: 44 },
  { place: 3, h: 52, size: 44 },
];

/** 5d 대회 · 종료: 시상대(1·2·3등), 우승자 상품, 판별 최종 순위표 */
const ContestResult = ({ contest: c, myId, onHome, t, lang }) => {
  const ranked = c.standings.filter(s => !s.left);
  const winners = ranked.filter(s => s.rank === 1);
  // 시상대는 2·1·3 순서로 놓는다. 공동 순위면 앞사람부터 채운다
  const podium = PODIUM.map((p, i) => ({ ...p, s: ranked[i] })).filter(p => p.s);
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);
  const note = c.endReason === 'SHORT_HANDED' ? 'finalNoteShort' : c.endReason === 'STORE_CLOSED' ? 'finalNoteClosed' : 'finalNote';

  return (
    <>
      <main style={{ boxSizing: 'border-box', padding: '20px 20px 140px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={pill(PILL.gray)}>{t('contest', 'badgeFinished')}</span>
            <span style={pill([`rgba(${V('--th-primary-rgb')}, 0.12)`, V('--th-primary')])}>{t('contest', 'badgeContest')}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: V('--th-text') }}>{c.title}</h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'resultSub'), { when: contestWhen(c.startsAt, lang), n: ranked.length, r: c.rounds })}
          </span>
        </section>

        {winners.length > 0 && (
          <section style={{ ...card, padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('contest', winners.length > 1 ? 'winnersTie' : 'winner')}</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{winners.map(w => w.nickname ?? t('contest', 'leftMember')).join(' · ')}</span>
              {c.prizeText && <span style={{ fontSize: '13px', fontWeight: 700, color: '#B4500A' }}>{fmt(t('contest', 'prizeLine'), { prize: c.prizeText })}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))`, alignItems: 'end', gap: '8px' }}>
              {order.map(({ place, h, size, s }) => {
                const first = place === 1;
                const mine = s.memberId != null && s.memberId === myId;
                return (
                  <div key={place} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{
                      width: size, height: size, borderRadius: 999, boxSizing: 'border-box',
                      backgroundColor: first ? '#C7D2FE' : V('--th-bg-deep'), border: first ? `3px solid ${V('--th-primary')}` : 'none',
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: first ? 700 : 500, display: 'flex', alignItems: 'center', gap: '4px', color: V('--th-text'), maxWidth: '100%' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nickname ?? t('contest', 'leftMember')}</span>
                      {mine && <span style={meBadge}>{t('contest', 'meBadge')}</span>}
                    </span>
                    <span style={{ fontSize: '12px', color: V('--th-text-sub'), textAlign: 'center' }}>
                      {fmt(t('contest', 'podiumLine'), { pts: s.total, vp: Math.round(s.gameScore) })}
                    </span>
                    <div style={{
                      width: '100%', height: h, borderRadius: '12px 12px 0 0',
                      backgroundColor: first ? V('--th-primary') : place === 2 ? '#E5E7EB' : '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: first ? '26px' : '22px', fontWeight: 700, color: first ? '#fff' : '#4B5563',
                    }}>{s.rank}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={sectionTitle}>{t('contest', 'finalTitle')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('contest', 'standingsSub')}</span>
          </div>
          <ContestStandings standings={c.standings} rounds={c.rounds} myId={myId} t={t} />
          <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{fmt(t('contest', note), { n: c.rounds })}</span>
        </section>
      </main>
      <StoreFixedBottom>
        <button onClick={onHome} style={primaryButton()}>{t('contest', 'toHome')}</button>
      </StoreFixedBottom>
    </>
  );
};

export default ContestResult;
