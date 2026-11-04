import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { fmt } from '../store/fmt';
import { card, primaryButton, recorderBadge, sectionTitle } from '../store/storeStyles';
import StoreFixedBottom from '../store/StoreFixedBottom';
import { ConfirmDialog } from '../store/StorePopup';
import { PILL, contestWhen, pill } from './contestUtils';

const smallPill = (on) => ({
  height: 36, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontSize: '13px', fontWeight: 700, flexShrink: 0,
  border: `1px solid ${on ? '#E3F2E9' : `rgba(${V('--th-primary-rgb')}, 0.35)`}`,
  backgroundColor: on ? '#E3F2E9' : V('--th-card'), color: on ? '#2F6B4C' : V('--th-primary'),
});

const ROUND_STAFF = {
  PLAYING: 'staffRoundPlaying',
  AWAITING_CONFIRM: 'staffRoundConfirming',
  DISPUTED: 'staffRoundDisputed',
};

/**
 * 5e STAFF · 대회 진행: 시작 전엔 도착 확인 + 권한 부여(기록자) + 시작/취소,
 * 시작 후엔 판별 상태("확인하기" → 5c) + 현재 순위. 남은 인원이 최소 인원 밑으로 끝났으면 안내
 */
const ContestStaff = ({ contest: c, busy, error, onArrive, onStart, onCancel, onCheck, onResult, t, lang }) => {
  const [recorderId, setRecorderId] = useState(null);
  const [asking, setAsking] = useState(false);
  const ready = c.status === 'RECRUITING';
  const playing = c.status === 'PLAYING';
  const short = c.status === 'FINISHED';
  const done = c.roundStates.filter(r => r.status === 'DONE').length;

  const applicants = c.entries.filter(e => e.status === 'APPLIED' && e.memberId != null);
  const arrived = applicants.filter(e => e.arrived);
  const recorder = arrived.find(e => e.memberId === recorderId) ?? arrived[0];
  const maxStart = Math.min(c.maxPlayers, c.capacity);
  const canStart = c.today && !c.roomClosed && arrived.length >= c.minPlayers && arrived.length <= maxStart;

  return (
    <>
      <main style={{ boxSizing: 'border-box', padding: '20px 20px 200px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ready && <span style={pill(PILL.orange)}>{t('contest', 'badgeBefore')}</span>}
          {playing && <span style={pill(PILL.green)}>{fmt(t('contest', 'badgeLiveRounds'), { n: c.rounds, d: done })}</span>}
          {short && <span style={pill(PILL.gray)}>{t('contest', 'badgeFinished')}</span>}
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{c.title}</h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'resultSub'), { when: contestWhen(c.startsAt, lang), n: c.capacity, r: c.rounds })}
          </span>
          {playing && c.recorderNickname && (
            <span style={{ fontSize: '13px', color: V('--th-text') }}>{t('contest', 'recorderLine')}<b>{c.recorderNickname}</b></span>
          )}
        </section>

        {ready && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={sectionTitle}>{t('contest', 'arrivalTitle')}</h2>
              <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-primary') }}>{fmt(t('contest', 'arrivalCount'), { a: arrived.length, b: applicants.length })}</span>
            </div>
            <div style={{ ...card, padding: '4px 16px' }}>
              {applicants.length === 0 && (
                <div style={{ height: 56, display: 'flex', alignItems: 'center', fontSize: '14px', color: V('--th-text-sub') }}>{t('contest', 'noEntries')}</div>
              )}
              {applicants.map((e, i) => {
                const isRec = e.arrived && recorder?.memberId === e.memberId;
                return (
                  <div key={e.memberId} style={{ height: 56, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                    <MemberDiceAvatar memberId={e.memberId} nickname={e.nickname} size={32} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nickname}</span>
                      {isRec && <span style={recorderBadge}>{t('contest', 'recorderBadge')}</span>}
                    </span>
                    {e.arrived && !isRec && (
                      <button onClick={() => setRecorderId(e.memberId)} style={{
                        height: 36, padding: '0 10px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                        border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'), fontSize: '12px', fontWeight: 700,
                      }}>{t('contest', 'makeRecorder')}</button>
                    )}
                    <button
                      onClick={() => onArrive(e.memberId, !e.arrived)}
                      disabled={busy || !c.today}
                      aria-pressed={e.arrived}
                      style={{ ...smallPill(e.arrived), opacity: c.today ? 1 : 0.5 }}
                    >{t('contest', e.arrived ? 'arrived' : 'markArrived')}</button>
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
              {c.today
                ? <>{fmt(t('contest', 'arrivalHelp1'), { game: c.gameName, n: c.minPlayers })}<b>{t('contest', 'arrivalHelpBold')}</b>{t('contest', 'arrivalHelp2')}</>
                : fmt(t('contest', 'notToday'), { date: contestWhen(c.startsAt, lang) })}
            </span>
          </section>
        )}

        {short && (
          <section style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#7C2D12' }}>{t('contest', 'shortTitle')}</span>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7C2D12' }}>{t('contest', 'shortBody')}</span>
            <button onClick={onResult} style={{ alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: V('--th-primary') }}>
              {t('contest', 'seeResult')}
            </button>
          </section>
        )}

        {playing && (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={sectionTitle}>{t('contest', 'roundsTitle')}</h2>
              <div style={{ ...card, padding: '4px 16px' }}>
                {c.roundStates.map((r, i) => {
                  const border = i ? `1px solid ${V('--th-border')}` : 0;
                  if (r.status === 'AWAITING_STAFF') {
                    return (
                      <div key={r.round} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: border }}>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{fmt(t('contest', 'roundN'), { n: r.round })}</span>
                          <span style={{ fontSize: '12px', color: '#B4500A' }}>{t('contest', 'staffRoundReady')}</span>
                        </span>
                        <button onClick={() => onCheck(r.matchId)} style={{ height: 40, padding: '0 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                          {t('contest', 'check')}
                        </button>
                      </div>
                    );
                  }
                  const waiting = r.status === 'WAITING' || r.status === 'CANCELLED';
                  const text = r.status === 'DONE' ? t('contest', 'staffRoundDone')
                    : waiting ? fmt(t('contest', 'staffRoundNext'), { n: r.round - 1 })
                      : t('contest', ROUND_STAFF[r.status] ?? 'staffRoundPlaying');
                  return (
                    <div key={r.round} style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: border }}>
                      <span style={{ fontSize: '15px', fontWeight: 500, color: waiting ? '#9CA3AF' : V('--th-text') }}>{fmt(t('contest', 'roundN'), { n: r.round })}</span>
                      <span style={{ fontSize: '13px', fontWeight: r.status === 'DONE' ? 700 : 500, color: r.status === 'DONE' ? '#2F6B4C' : waiting ? '#9CA3AF' : '#B4500A' }}>{text}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={sectionTitle}>{t('contest', 'standingsNow')}</h2>
              <div style={{ ...card, padding: '4px 16px' }}>
                {c.standings.filter(s => !s.left).map((s, i) => (
                  <div key={s.memberId ?? i} style={{ height: 48, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                    <span style={{ width: 20, fontSize: '15px', fontWeight: 700, color: V('--th-text-sub') }}>{s.rank}</span>
                    <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>{s.nickname ?? t('contest', 'leftMember')}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-primary') }}>{fmt(t('contest', 'ptsN'), { n: s.total })}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {ready && (
        <StoreFixedBottom>
          {c.roomClosed ? (
            <>
              <button disabled style={primaryButton(false)}>{t('contest', 'start')}</button>
              <span style={{ textAlign: 'center', fontSize: '12px', lineHeight: 1.5, color: V('--th-text-sub') }}>{fmt(t('contest', 'roomClosedBlock'), { game: c.gameName })}</span>
            </>
          ) : canStart ? (
            <>
              <button onClick={() => onStart(recorder?.memberId)} disabled={busy} style={primaryButton(!busy)}>{fmt(t('contest', 'startN'), { n: arrived.length })}</button>
              <span style={{ textAlign: 'center', fontSize: '12px', color: V('--th-text-sub') }}>
                {t('contest', arrived.length < applicants.length ? 'startHintMissing' : 'startHintAll')}
              </span>
            </>
          ) : (
            <>
              <button disabled style={primaryButton(false)}>{t('contest', 'start')}</button>
              <span style={{ textAlign: 'center', fontSize: '12px', color: V('--th-text-sub') }}>{fmt(t('contest', 'startMin'), { game: c.gameName, n: c.minPlayers })}</span>
            </>
          )}
          <button onClick={() => setAsking(true)} disabled={busy} style={{ height: 40, border: 'none', background: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: '14px', fontWeight: 700 }}>
            {t('contest', 'cancelContest')}
          </button>
          {error && <span role="alert" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>}
        </StoreFixedBottom>
      )}

      {asking && (
        <ConfirmDialog
          title={t('contest', 'cancelTitle')}
          body={t('contest', 'cancelBody')}
          cancelLabel={t('contest', 'close')}
          actionLabel={t('contest', 'cancelContest')}
          busy={busy}
          onCancel={() => setAsking(false)}
          onAction={async () => { await onCancel(); setAsking(false); }}
        />
      )}
    </>
  );
};

export default ContestStaff;
