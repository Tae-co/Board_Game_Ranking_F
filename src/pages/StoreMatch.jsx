import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelStoreMatch, confirmStoreMatch, disputeStoreMatch, getStoreMatch, reopenStoreMatch,
  saveStoreMatchDraft, startStoreMatch, storeErrorCode, submitStoreMatch,
} from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';
import { CURRENT_PARTY_KEY, useAutoEnterMatch, useCurrentParty } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import ScoreSheet from './ScoreSheet';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { ConfirmDialog } from '../components/store/StorePopup';
import { fmt, num } from '../components/store/fmt';
import { card, ghostButton, hintText, meBadge, primaryButton } from '../components/store/storeStyles';
import { CONTEST_PATH, placementPoints } from '../components/contest/contestUtils';

const GREEN = '#2F6B4C';
const DRAFT_DEBOUNCE_MS = 600;

const ms = (iso) => (iso ? new Date(iso).getTime() : null);
const minutesBetween = (a, b) => Math.round((ms(b) - ms(a)) / 60000);
const hhmm = (iso) => new Date(iso).toTimeString().slice(0, 5);
const clock = (millis) => {
  const s = Math.max(0, Math.floor(millis / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const elapsedClock = (millis) => {
  const s = Math.max(0, Math.floor(millis / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const parseDraft = (json) => {
  try { return json ? JSON.parse(json) : null; } catch { return null; }
};

/** 서버 시각 기준 지금. 기기 시계가 틀려도 되게 응답의 serverNow와의 차이로 보정한다 */
const useServerNow = (serverNow) => {
  const [now, setNow] = useState(() => ms(serverNow) ?? 0);
  useEffect(() => {
    const offset = serverNow ? ms(serverNow) - Date.now() : 0;
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [serverNow]);
  return now;
};

const WarnBox = ({ text1, strong, text2 }) => (
  <section style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>
    <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7F1D1D' }}>{text1}<b>{strong}</b>{text2}</span>
  </section>
);

/** 경과 시간 카드 (시안 3d·3e·3f·3k·3m) */
const ElapsedCard = ({ match, now, t, over = false }) => {
  const started = ms(match.startedAt);
  const total = ms(match.saveDeadline) - started;
  const elapsed = (over ? ms(match.endedAt) : now) - started;
  const saveOpen = now >= ms(match.saveOpensAt);
  const resaving = !!match.firstSavedAt && !over;
  const pulled = ms(match.saveDeadline) < started + match.maxMinutes * 60000;
  const deadlineMin = minutesBetween(match.startedAt, match.saveDeadline);
  const endLabel = pulled
    ? fmt(t('store', 'saveUntilClose'), { n: deadlineMin, close: hhmm(match.saveDeadline) })
    : fmt(t('store', 'saveUntil'), { n: match.maxMinutes });
  let status = saveOpen ? t('store', 'canSave') : fmt(t('store', 'saveIn'), { n: Math.ceil((ms(match.saveOpensAt) - now) / 60000) });
  if (resaving) status = fmt(t('store', 'firstSavedLine'), { n: minutesBetween(match.startedAt, match.firstSavedAt) });
  if (over) status = t('store', 'timeOverBar');
  const statusColor = over ? '#B91C1C' : saveOpen || resaving ? GREEN : '#B4500A';
  const progress = resaving || over ? 100 : Math.min(100, (elapsed / total) * 100);

  return (
    <section style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'elapsed')}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor }}>{status}</span>
      </div>
      <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.02em', color: V('--th-text') }}>{elapsedClock(elapsed)}</span>
      <div style={{ position: 'relative', height: 8, borderRadius: 999, backgroundColor: V('--th-bg-deep') }}>
        <div style={{ position: 'absolute', left: `${Math.min(100, (match.minMinutes * 60000 / total) * 100)}%`, right: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: '#D1FAE5' }} />
        <div style={{ position: 'absolute', left: 0, width: `${progress}%`, top: 0, bottom: 0, borderRadius: 999, backgroundColor: over ? '#DC2626' : V('--th-primary') }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: V('--th-text-sub') }}>
        <span>{t('store', 'zeroMin')}</span>
        <span>{fmt(t('store', 'saveFrom'), { n: match.minMinutes })}</span>
        <span>{resaving ? fmt(t('store', 'savedWithin'), { n: deadlineMin }) : endLabel}</span>
      </div>
      {pulled && !resaving && !over && (
        <span style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 700, color: '#B4500A' }}>
          {fmt(t('store', 'closeShortNotice'), { close: hhmm(match.saveDeadline), n: deadlineMin })}
        </span>
      )}
    </section>
  );
};

/** 순위 · 이름 · 게임 점수 목록 (시안 3i·3j·3n). 대회 판(contest)이면 순위 점수도 */
const ResultList = ({ participants, myId, t, showDelta = false, contest = false }) => (
  <section style={{ ...card, padding: '4px 16px' }}>
    {[...participants].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99)).map((p, i) => (
      <div key={p.memberId ?? `x${i}`} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
        <span style={{ width: 36, fontSize: '15px', fontWeight: 700, color: p.placement === 1 ? V('--th-primary') : V('--th-text-sub') }}>
          {p.placement ? fmt(t('store', 'placeN'), { n: p.placement }) : '-'}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname ?? t('store', 'leftMember')}</span>
          {p.memberId === myId && <span style={meBadge}>{t('store', 'meBadge')}</span>}
        </span>
        {contest && p.placement != null ? (
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>
            {fmt(t('contest', 'gameScore'), { n: num(p.gameScore) })}{fmt(t('contest', 'pointsSuffix'), { n: placementPoints(participants.length, p.placement) })}
          </span>
        ) : p.gameScore != null && (
          <span style={{ fontSize: showDelta ? '13px' : '15px', fontWeight: showDelta ? 500 : 700, color: showDelta ? V('--th-text-sub') : V('--th-text') }}>
            {showDelta ? fmt(t('store', 'gameScoreValue'), { n: num(p.gameScore) }) : num(p.gameScore)}
          </span>
        )}
        {showDelta && p.ratingChange != null && (
          <span style={{ width: 48, textAlign: 'right', fontSize: '15px', fontWeight: 700, color: p.ratingChange > 0 ? GREEN : V('--th-text-sub') }}>
            {p.ratingChange > 0 ? `+${p.ratingChange}` : p.ratingChange}
          </span>
        )}
      </div>
    ))}
  </section>
);

/** 기록자 점수판 입력을 같이 하는 사람 화면에 보낸다 (debounce) */
const useDraftSync = (matchId, enabled) => {
  const timer = useRef(null);
  const first = useRef(true);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback((scores) => {
    if (!enabled) return;
    // 처음 그려질 때 들어오는 값은 이미 서버에 있는 값이다
    if (first.current) { first.current = false; return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveStoreMatchDraft(matchId, JSON.stringify(scores)).catch(() => {});
    }, DRAFT_DEBOUNCE_MS);
  }, [matchId, enabled]);
};

/**
 * 매장 판 화면 `/store/match/:matchId` — 상태·역할로 나눈다 (plan-store §2 3d~3n).
 * PLAYING/DISPUTED: 기록자 점수판(3d·3e·3k) / 같이 하는 사람 읽기 전용(3f)
 * AWAITING_CONFIRM: 기록자 3i / 같이 한 사람 3j · RECORDED 3n · EXPIRED 3m · CANCELLED → 게임방
 * 대회 판(match.contest): 시간 바·게임 취소 없음, 참가자 확인 뒤 AWAITING_STAFF(STAFF 확인 중), 반영되면 대회 화면(5b)
 */
const StoreMatch = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const myId = Number(getAuthUserId());
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: match, isError } = useQuery({
    queryKey: ['store', 'match', Number(matchId)],
    queryFn: () => getStoreMatch(matchId),
    refetchInterval: 1000 * 15,
  });
  const { data: party } = useCurrentParty();
  const now = useServerNow(match?.serverNow);
  const ended = match && ['RECORDED', 'EXPIRED', 'CANCELLED'].includes(match.status);
  // 끝난 판(3n·3m)도 기다리는 화면이라 기록자가 다음 판을 시작하면 그 점수판으로 간다
  useAutoEnterMatch(ended ? party : null, myId, navigate, Number(matchId));

  const isRecorder = match?.recorderMemberId === myId;
  const editable = match && (match.status === 'PLAYING' || match.status === 'DISPUTED');
  const onScoresChange = useDraftSync(matchId, !!(isRecorder && editable));
  const players = useMemo(() => (match?.participants ?? [])
    .filter(p => p.memberId != null)
    .map(p => ({ memberId: p.memberId, nickname: p.nickname })), [match?.participants]);

  const refresh = async (next) => {
    if (next) queryClient.setQueryData(['store', 'match', Number(matchId)], next);
    await queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
  };
  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await refresh(await fn());
    } catch (e) {
      setError(e?.response?.data?.message ?? t('store', 'actionFailed'));
      queryClient.invalidateQueries({ queryKey: ['store', 'match', Number(matchId)] });
    } finally {
      setBusy(false);
    }
  };

  if (isError) return <Navigate to="/community" replace />;
  if (!match) return <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }} />;

  const contest = match.contest;
  const roomPath = contest ? CONTEST_PATH(match.store.id, contest.id) : `/store/${match.store.id}/rooms/${match.storeRoomId}`;
  if (match.status === 'CANCELLED') return <Navigate to={roomPath} replace state={{ notice: 'cancelled' }} />;
  // 대회 판은 STAFF가 반영하면 대회 화면(5b)에서 그 판 순위 점수·현재 순위를 본다
  if (contest && match.status === 'RECORDED') return <Navigate to={roomPath} replace />;
  const inMatch = match.participants.some(p => p.memberId === myId);
  // 같이 하지 않은 STAFF는 5c에서 본다
  if (contest && !inMatch) return <Navigate to={`${roomPath}/confirm/${match.id}`} replace />;

  const game = match.gameName;
  const contestRound = contest ? { game, n: contest.round } : null;
  const confirmedCount = match.participants.filter(p => p.memberId != null && p.confirmed).length;
  const activeCount = match.participants.filter(p => p.memberId != null).length;
  const mine = match.participants.find(p => p.memberId === myId);
  const back = () => navigate(roomPath);
  const errorLine = error && <span role="alert" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>;

  // ── 3d·3e·3k 기록자 점수판 / 3f 같이 하는 사람 ──
  if (editable) {
    const disputed = match.status === 'DISPUTED';
    const resaving = !!match.firstSavedAt;
    const saveOpen = now >= ms(match.saveOpensAt);
    const draft = parseDraft(match.draftJson);
    const header = (
      <StoreTopBar
        title={contest ? fmt(t('contest', 'playingTitle'), contestRound) : fmt(t('store', 'playingTitle'), { game })}
        onBack={back}
        backLabel={t('common', 'back')}
        right={isRecorder && !contest ? (
          <button onClick={() => setDialog('cancel')} style={{ height: 44, padding: '0 10px', border: 'none', background: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: '14px', fontWeight: 700 }}>
            {t('store', 'cancelGame')}
          </button>
        ) : null}
      />
    );
    const top = (
      <div style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!isRecorder && (
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>
            {fmt(t('store', 'recordingBy'), { name: match.recorderNickname })}
          </span>
        )}
        {isRecorder && disputed && (
          <section style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#9A3412' }}>
              {contest?.staffReturned ? t('contest', 'staffReturned') : fmt(t('store', 'disputedBy'), { name: match.disputedByNickname })}
            </span>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#7C2D12' }}>{t('store', 'disputedDesc')}</span>
          </section>
        )}
        {!isRecorder && disputed && match.disputedByMemberId === myId && (
          <section style={{ backgroundColor: V('--th-bg-deep'), borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'disputedDone')}</span>
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{fmt(t('store', 'disputedDoneDesc'), { name: match.recorderNickname })}</span>
          </section>
        )}
        {contest ? (
          <section style={{ backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, borderRadius: '16px', padding: '12px 16px', fontSize: '13px', lineHeight: 1.5, color: V('--th-primary') }}>
            {t('contest', 'noTimeLimit')}
          </section>
        ) : <ElapsedCard match={match} now={now} t={t} />}
      </div>
    );
    const after = (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
          {t('store', isRecorder ? 'recorderNote' : 'viewerLiveNote')}
        </span>
        <WarnBox text1={t('store', 'fakeWarn1')} strong={t('store', 'fakeWarnReset')} text2={t('store', 'fakeWarn2')} />
      </div>
    );
    const renderBottom = ({ submit, isSubmitting }) => (
      <StoreFixedBottom>
        {isRecorder ? (
          <>
            <button onClick={submit} disabled={!saveOpen || isSubmitting} style={primaryButton(saveOpen && !isSubmitting)}>
              {t('store', resaving ? 'resave' : 'saveResult')}
            </button>
            <span style={hintText}>
              {!saveOpen ? fmt(t('store', 'saveEarlyHint'), { n: match.minMinutes })
                : resaving ? (contest ? t('contest', 'resaveHint') : t('store', 'resaveHint')) : t('store', 'saveResultHint')}
            </span>
            {errorLine}
          </>
        ) : (
          <>
            <button disabled style={primaryButton(false)}>{t('store', 'waitingSave')}</button>
            <span style={hintText}>{t('store', 'waitingSaveHint')}</span>
          </>
        )}
      </StoreFixedBottom>
    );
    const onSubmit = async (participants) => {
      setError(null);
      try {
        await refresh(await submitStoreMatch(matchId, participants));
      } catch (e) {
        setError(storeErrorCode(e) ? e.response.data.message : t('store', 'saveFailed'));
        queryClient.invalidateQueries({ queryKey: ['store', 'match', Number(matchId)] });
      }
    };
    return (
      <>
        <ScoreSheet
          // 같이 하는 사람은 기록자 입력이 올 때마다 다시 그린다 (읽기 전용이라 잃을 입력이 없다)
          key={isRecorder ? 'recorder' : `viewer-${match.draftVersion}`}
          storeMode={{
            boardGameId: match.boardGameId,
            gameName: game,
            players,
            savedScores: draft,
            readOnly: !isRecorder,
            header, top, after, renderBottom, onSubmit,
            onScoresChange: isRecorder ? onScoresChange : undefined,
          }}
        />
        {dialog === 'cancel' && (
          <ConfirmDialog
            title={t('store', resaving ? 'cancelThisTitle' : 'cancelTitle')}
            body={t('store', resaving ? 'cancelThisDesc' : 'cancelDesc')}
            note={resaving ? null : t('store', 'cancelDesc2')}
            cancelLabel={t('store', resaving ? 'close' : 'keepPlaying')}
            actionLabel={t('store', 'cancelGame')}
            busy={busy}
            onCancel={() => setDialog(null)}
            onAction={() => act(() => cancelStoreMatch(matchId))}
          />
        )}
      </>
    );
  }

  const shell = (title, body, bottom) => (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={title} onBack={back} backLabel={t('common', 'back')} />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 180px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {body}
      </main>
      <StoreFixedBottom>{bottom}{errorLine}</StoreFixedBottom>
    </div>
  );
  const gameMinutes = minutesBetween(match.startedAt, match.firstSavedAt ?? match.endedAt ?? new Date(now).toISOString());

  // ── 3i 확인 기다리는 중 (기록자) ──
  if (match.status === 'AWAITING_CONFIRM' && isRecorder) {
    return shell(contest ? fmt(t('contest', 'waitTitle'), { game }) : fmt(t('store', 'confirmWaitTitle'), { game }), (
      <>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {contest ? fmt(t('contest', 'gameTime'), { ...contestRound, m: gameMinutes }) : fmt(t('store', 'gameTime'), { game, n: gameMinutes })}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '0.02em', color: V('--th-text') }}>{clock(ms(match.confirmDeadline) - now)}</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{contest ? t('contest', 'countLine') : t('store', 'timeoutRecord')}</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-primary') }}>{fmt(t('store', 'confirmCount'), { a: confirmedCount, b: activeCount })}</span>
        </section>
        <ResultList participants={match.participants} myId={myId} t={t} contest={!!contest} />
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'confirmStatus')}</h2>
          <div style={{ ...card, padding: '4px 16px' }}>
            {match.participants.filter(p => p.memberId != null).map((p, i) => (
              <div key={p.memberId} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i ? `1px solid ${V('--th-border')}` : 0 }}>
                <span style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, backgroundColor: V('--th-bg-deep') }} />
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                  {p.nickname}{p.memberId === match.recorderMemberId ? t('store', 'recorderSuffix') : ''}
                </span>
                {p.confirmed ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: GREEN }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                    {t('store', 'confirmed')}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#9CA3AF' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid #D1D5DB', boxSizing: 'border-box' }} />
                    {t('store', 'waitingConfirm')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
        <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>
          {contest ? t('contest', 'ruleLine') : fmt(t('store', 'confirmRule'), { max: match.maxMinutes })}
        </span>
      </>
    ), (
      <>
        <button onClick={() => act(() => reopenStoreMatch(matchId))} disabled={busy} style={ghostButton}>{t('store', 'fixScores')}</button>
        <span style={hintText}>{t('store', 'fixScoresHint')}</span>
      </>
    ));
  }

  // ── 3j 결과 확인 (같이 한 사람) ──
  if (match.status === 'AWAITING_CONFIRM') {
    const done = mine?.confirmed;
    return shell(fmt(t('store', 'confirmTitle'), { game }), (
      <>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', padding: '8px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {contest ? fmt(t('contest', 'gameTime'), { ...contestRound, m: gameMinutes }) : fmt(t('store', 'gameTime'), { game, n: gameMinutes })}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: V('--th-text') }}>{fmt(t('store', 'savedBy'), { name: match.recorderNickname })}</span>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'checkTable')}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-primary') }}>
            {done
              ? fmt(t('store', 'confirmCount'), { a: confirmedCount, b: activeCount })
              : fmt(t('store', 'timerRecord'), { t: clock(ms(match.confirmDeadline) - now) })}
          </span>
        </section>
        <ResultList participants={match.participants} myId={myId} t={t} contest={!!contest} />
        <WarnBox text1={fmt(t('store', 'fakeWarnConfirm1'), { game })} strong={t('store', 'fakeWarnReset')} text2={t('store', 'fakeWarnConfirm2')} />
      </>
    ), done ? (
      <button disabled style={{ ...primaryButton(false), color: GREEN }}>{t('store', 'confirmedDone')}</button>
    ) : mine ? (
      <>
        <button onClick={() => act(() => confirmStoreMatch(matchId))} disabled={busy} style={primaryButton(!busy)}>{t('store', 'yesConfirm')}</button>
        <button onClick={() => act(() => disputeStoreMatch(matchId))} disabled={busy} style={{ ...ghostButton, color: '#B91C1C' }}>{t('store', 'disputeButton')}</button>
      </>
    ) : null);
  }

  // ── 대회 판 STAFF 확인 중 (시안 3i contestStaff) ──
  if (match.status === 'AWAITING_STAFF') {
    return shell(fmt(t('contest', 'staffStageTitle'), { game }), (
      <>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', padding: '8px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'staffStageLine'), { ...contestRound, a: confirmedCount, b: activeCount })}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: V('--th-text') }}>{t('contest', 'staffStageBig')}</span>
          <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('contest', 'staffStageBody')}</span>
        </section>
        <ResultList participants={match.participants} myId={myId} t={t} contest />
      </>
    ), (
      <button onClick={back} style={ghostButton}>{t('contest', 'backToContest')}</button>
    ));
  }

  // 끝난 판 다음은 지금 그룹 기록자가 고른다 (판 사이에 기록자가 바뀌었을 수 있다)
  const iAmPartyRecorder = party?.recorderMemberId === myId;
  const nextRecorderName = party?.members.find(m => m.recorder)?.nickname ?? match.recorderNickname;
  const waitingNext = (hintKey) => (
    <>
      <button disabled style={primaryButton(false)}>{fmt(t('store', 'nextChoosing'), { name: nextRecorderName })}</button>
      <span style={hintText}>{t('store', hintKey)}</span>
    </>
  );

  // ── 3n 기록 완료 ──
  if (match.status === 'RECORDED') {
    return shell(fmt(t('store', 'recordedTitle'), { game }), (
      <>
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0', textAlign: 'center' }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: '#DCFCE7', color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          </span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'recorded')}</span>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {match.endReason === 'TIMEOUT' ? t('store', 'howTimeout') : fmt(t('store', 'howAll'), { n: activeCount })}
          </span>
        </section>
        {mine?.ratingAfter != null && (
          <section style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'myStoreScore'), { game })}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: V('--th-text') }}>{num(mine.ratingAfter)}</span>
              <span style={{ fontSize: '17px', fontWeight: 700, color: mine.ratingChange > 0 ? GREEN : V('--th-text-sub') }}>
                {mine.ratingChange > 0 ? `+${mine.ratingChange}` : mine.ratingChange}
              </span>
            </span>
            {match.myRankAfter != null && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-primary') }}>
                {match.myRankBefore != null
                  ? fmt(t('store', 'rankChange'), { a: match.myRankBefore, b: match.myRankAfter })
                  : fmt(t('store', 'rankNow'), { b: match.myRankAfter })}
              </span>
            )}
          </section>
        )}
        <ResultList participants={match.participants} myId={myId} t={t} showDelta />
      </>
    ), iAmPartyRecorder ? (
      <button onClick={() => navigate(`/store/${match.store.id}`)} style={primaryButton()}>{t('store', 'pickNext')}</button>
    ) : waitingNext('bubbleHint'));
  }

  // ── 3m 기록 시간 지남 ──
  const byClose = match.endReason === 'EXPIRED_CLOSE';
  const restart = () => act(async () => {
    const next = await startStoreMatch(match.store.id, match.storeRoomId);
    navigate(`/store/match/${next.id}`, { replace: true });
  });
  return shell(fmt(t('store', 'timeOverTitle'), { game }), (
    <>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'timeOver')}</span>
        <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub') }}>
          {byClose ? fmt(t('store', 'whyClose'), { close: hhmm(match.closesAt) }) : fmt(t('store', 'whyMax'), { n: match.maxMinutes })}{' '}
          {t('store', 'closedNoRecord')}
        </span>
      </section>
      <ElapsedCard match={match} now={now} t={t} over />
      <section style={{ ...card, padding: '4px 16px' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'playedWith')}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text'), textAlign: 'right' }}>
            {match.participants.map(p => p.nickname ?? t('store', 'leftMember')).join(' · ')}
          </span>
        </div>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${V('--th-border')}` }}>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'storeScore')}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'noChange')}</span>
        </div>
      </section>
      <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'sameNotice')}</span>
    </>
  ), iAmPartyRecorder ? (
    <>
      {!byClose && <button onClick={restart} disabled={busy} style={primaryButton(!busy)}>{t('store', 'restart')}</button>}
      <button onClick={() => navigate(`/store/${match.store.id}`)} style={ghostButton}>{t('store', 'pickOther')}</button>
    </>
  ) : waitingNext('nextChoosingHint'));
};

export default StoreMatch;
