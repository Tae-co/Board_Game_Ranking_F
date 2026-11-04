import { V } from '../../utils/cssUtils';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { fmt } from '../store/fmt';
import { card, ghostButton, meBadge, primaryButton, sectionTitle } from '../store/storeStyles';
import StoreFixedBottom from '../store/StoreFixedBottom';
import { PILL, contestWhen, pill, placementPoints } from './contestUtils';

const infoRow = { display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '12px', fontSize: '15px' };
const avatar = { width: 32, height: 32, borderRadius: 999, flexShrink: 0, backgroundColor: V('--th-bg-deep') };

/** 5a 대회 · 모집: 게임·일시·인원·판 수·상품, 진행 방식, 순위 점수표, 참가자, 하단 신청/취소/마감 */
const ContestDetail = ({ contest: c, myId, busy, onApply, onWithdraw, error, t, lang }) => {
  const applied = c.entries.length;
  const left = c.capacity - applied;
  const mine = c.myStatus === 'APPLIED';
  const pointCols = Array.from({ length: c.maxPlayers > 6 ? 4 : c.maxPlayers }, (_, i) => i + 1);

  let bottom;
  if (c.viewer === 'STAFF' || c.viewer === 'STAFF_OTHER') {
    bottom = <button disabled style={primaryButton(false)}>{t('contest', 'staffNoJoin')}</button>;
  } else if (c.viewer !== 'MEMBER') {
    bottom = <button disabled style={primaryButton(false)}>{t('contest', 'membersOnlyBottom')}</button>;
  } else if (mine) {
    bottom = (
      <>
        <span style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#2F6B4C' }}>{t('contest', 'appliedLine')}</span>
        <button onClick={onWithdraw} disabled={busy} style={{ ...ghostButton, height: 48, color: '#B91C1C' }}>{t('contest', 'withdraw')}</button>
      </>
    );
  } else if (left <= 0) {
    bottom = <button disabled style={primaryButton(false)}>{fmt(t('contest', 'fullN'), { a: applied, b: c.capacity })}</button>;
  } else {
    bottom = <button onClick={onApply} disabled={busy} style={primaryButton(!busy)}>{fmt(t('contest', 'applyN'), { n: left })}</button>;
  }

  return (
    <>
      <main style={{ boxSizing: 'border-box', padding: '20px 20px 160px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={pill(PILL.orange)}>{t('contest', c.today ? 'badgeToday' : 'badgeRecruiting')}</span>
            <span style={pill([`rgba(${V('--th-primary-rgb')}, 0.12)`, V('--th-primary')])}>{t('contest', 'badgeContest')}</span>
            {c.roomClosed && <span style={pill(PILL.gray)}>{t('contest', 'badgeRoomClosed')}</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: V('--th-text') }}>{c.title}</h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{[c.store.name, c.store.branch].filter(Boolean).join(' ')}</span>
        </section>

        <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', color: V('--th-text') }}>
          <div style={infoRow}>
            <span style={{ color: V('--th-text-sub') }}>{t('contest', 'infoGame')}</span>
            <span style={{ fontWeight: 500 }}>
              {c.gameName}
              {c.roomClosed && <span style={{ color: V('--th-text-sub'), fontWeight: 400 }}> · {t('contest', 'roomClosedLine')}</span>}
            </span>
          </div>
          <div style={infoRow}><span style={{ color: V('--th-text-sub') }}>{t('contest', 'infoWhen')}</span><span style={{ fontWeight: 500 }}>{contestWhen(c.startsAt, lang)}</span></div>
          <div style={infoRow}>
            <span style={{ color: V('--th-text-sub') }}>{t('contest', 'infoPlayers')}</span>
            <span style={{ fontWeight: 500 }}>
              {fmt(t('contest', 'playersValue'), { a: applied, b: c.capacity })}
              <span style={{ color: V('--th-text-sub'), fontWeight: 400 }}> · {fmt(t('contest', 'playersFit'), { game: c.gameName })}</span>
            </span>
          </div>
          <div style={infoRow}><span style={{ color: V('--th-text-sub') }}>{t('contest', 'infoRounds')}</span><span style={{ fontWeight: 500 }}>{fmt(t('contest', 'roundsValue'), { n: c.rounds })}</span></div>
          <div style={infoRow}>
            <span style={{ color: V('--th-text-sub') }}>{t('contest', 'infoPrize')}</span>
            <span style={{ fontWeight: 500 }}>{c.prizeText ? fmt(t('contest', 'prizeValue'), { prize: c.prizeText }) : t('contest', 'prizeNone')}</span>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={sectionTitle}>{t('contest', 'howTitle')}</h2>
          <div style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', lineHeight: 1.6, color: V('--th-text') }}>
              <li>{t('contest', 'how1')}</li>
              <li>{t('contest', 'how2a')}<b>{t('contest', 'how2b')}</b>{t('contest', 'how2c')}</li>
              <li>{t('contest', 'how3a')}<b>{fmt(t('contest', 'how3b'), { n: c.rounds })}</b>{t('contest', 'how3c')}</li>
              <li>{t('contest', 'how4a')}<b>{t('contest', 'how4b')}</b>{t('contest', 'how4c')}</li>
              <li>{t('contest', 'how5a')}<b>{t('contest', 'how5b')}</b></li>
            </ul>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: 12, borderTop: `1px solid ${V('--th-border')}` }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text') }}>{t('contest', 'pointsTitle')}</span>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pointCols.length}, minmax(0, 1fr))`, gap: '6px' }}>
                {pointCols.map(p => (
                  <span key={p} style={{
                    borderRadius: '10px', padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    backgroundColor: p === 1 ? `rgba(${V('--th-primary-rgb')}, 0.12)` : V('--th-bg-deep'),
                  }}>
                    <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{fmt(t('contest', 'placeN'), { n: p })}</span>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: p === 1 ? V('--th-primary') : V('--th-text') }}>
                      {fmt(t('contest', 'pointsN'), { n: placementPoints(pointCols.length, p) })}
                    </span>
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
                {fmt(t('contest', 'pointsDesc'), { rounds: c.rounds, game: c.gameName })}
              </span>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={sectionTitle}>{t('contest', 'entriesTitle')}</h2>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('contest', 'playersValue'), { a: applied, b: c.capacity })}</span>
          </div>
          <div style={{ ...card, padding: '4px 16px' }}>
            {c.entries.map((e, i) => (
              <div key={e.memberId ?? `x${i}`} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                <MemberDiceAvatar memberId={e.memberId} nickname={e.nickname} size={32} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                  {e.nickname ?? t('contest', 'leftMember')}
                  {e.memberId === myId && <span style={meBadge}>{t('contest', 'meBadge')}</span>}
                </span>
              </div>
            ))}
            {left > 0 && (
              <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: applied ? `1px solid ${V('--th-border')}` : 0, color: '#9CA3AF' }}>
                <span style={{ ...avatar, backgroundColor: 'transparent', border: '2px dashed #D1D5DB', boxSizing: 'border-box' }} />
                <span style={{ fontSize: '15px' }}>{fmt(t('contest', 'seatsLeft'), { n: left })}</span>
              </div>
            )}
          </div>
        </section>
      </main>
      <StoreFixedBottom>
        {bottom}
        {error && <span role="alert" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>}
      </StoreFixedBottom>
    </>
  );
};

export default ContestDetail;
