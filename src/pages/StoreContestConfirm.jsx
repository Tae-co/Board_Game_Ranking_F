import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { approveContestMatch, getStoreMatch, sendBackContestMatch, storeErrorCode } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { fmt, num } from '../components/store/fmt';
import { card, primaryButton } from '../components/store/storeStyles';
import { contestKey, placementPoints } from '../components/contest/contestUtils';

const minutesBetween = (a, b) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);

/**
 * 5c 판 결과 확인 (STAFF) `/store/:storeId/contest/:contestId/confirm/:matchId`.
 * 같이 한 사람 확인(3j) 뒤. "확인하고 반영" → 다음 판이 같은 기록자로 열림 / "점수가 달라요" → 기록자 3k
 */
const StoreContestConfirm = () => {
  const { storeId, contestId, matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: match, isError } = useQuery({
    queryKey: ['store', 'match', Number(matchId)],
    queryFn: () => getStoreMatch(matchId),
    refetchInterval: 1000 * 10,
  });

  const back = () => navigate(`/store/${storeId}/contest/${contestId}`, { replace: true });
  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      queryClient.setQueryData(contestKey(contestId), await fn());
      back();
    } catch (e) {
      setError(storeErrorCode(e) ? e.response.data.message : t('store', 'actionFailed'));
      queryClient.invalidateQueries({ queryKey: ['store', 'match', Number(matchId)] });
    } finally {
      setBusy(false);
    }
  };

  if (isError) return <Navigate to={`/store/${storeId}/contest/${contestId}`} replace />;
  if (!match) return <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }} />;

  const players = match.participants.filter(p => p.memberId != null);
  const confirmed = players.filter(p => p.confirmed).length;
  const ready = match.status === 'AWAITING_STAFF';
  const sorted = [...match.participants].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('contest', 'confirmTitle')} onBack={back} backLabel={t('common', 'back')} />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{match.contest?.title}</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{fmt(t('contest', 'confirmRound'), { n: match.contest?.round })}</h1>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {fmt(t('contest', 'confirmBy'), { name: match.recorderNickname ?? '', m: minutesBetween(match.startedAt, match.firstSavedAt ?? match.serverNow) })}
          </span>
          <span style={{
            alignSelf: 'flex-start', marginTop: 4, fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: 999,
            backgroundColor: confirmed === players.length ? '#E3F2E9' : '#FFF1E6', color: confirmed === players.length ? '#2F6B4C' : '#B4500A',
          }}>{fmt(t('contest', 'confirmCount'), { a: confirmed, b: players.length })}</span>
        </section>

        <section style={{ ...card, padding: '4px 16px' }}>
          {sorted.map((p, i) => (
            <div key={p.memberId ?? `x${i}`} style={{
              height: 56, display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) 92px 56px', alignItems: 'center', gap: '8px',
              borderTop: i ? `1px solid ${V('--th-border')}` : 0,
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: p.placement === 1 ? V('--th-primary') : V('--th-text-sub') }}>
                {p.placement ? fmt(t('contest', 'placeN'), { n: p.placement }) : '-'}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nickname ?? t('contest', 'leftMember')}
              </span>
              <span style={{ textAlign: 'right', fontSize: '15px', color: V('--th-text') }}>
                {p.gameScore != null ? fmt(t('contest', 'gameScore'), { n: num(p.gameScore) }) : ''}
              </span>
              <span style={{ textAlign: 'right', fontSize: '15px', fontWeight: 700, color: V('--th-primary') }}>
                {p.placement ? fmt(t('contest', 'plusPts'), { n: placementPoints(match.participants.length, p.placement) }) : ''}
              </span>
            </div>
          ))}
        </section>

        <section style={{ backgroundColor: V('--th-bg-deep'), borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>{t('contest', 'tableCheckTitle')}</span>
          <span style={{ fontSize: '13px', lineHeight: 1.6, color: V('--th-text-sub') }}>
            {t('contest', 'tableCheck1')}<br />{fmt(t('contest', 'tableCheck2'), { n: players.length })}<br />{t('contest', 'tableCheck3')}
          </span>
        </section>
        {!ready && <span style={{ fontSize: '13px', color: '#B4500A' }}>{t('contest', 'notReady')}</span>}
      </main>
      <StoreFixedBottom>
        <button onClick={() => act(() => approveContestMatch(storeId, contestId, matchId))} disabled={!ready || busy} style={primaryButton(ready && !busy)}>
          {t('contest', 'approve')}
        </button>
        <span style={{ textAlign: 'center', fontSize: '12px', color: V('--th-text-sub') }}>{t('contest', 'approveHint')}</span>
        <button
          onClick={() => act(() => sendBackContestMatch(storeId, contestId, matchId))}
          disabled={!ready || busy}
          style={{ height: 44, border: 'none', borderRadius: '14px', background: 'none', cursor: ready ? 'pointer' : 'default', color: ready ? '#B91C1C' : V('--th-text-sub'), fontSize: '15px', fontWeight: 700 }}
        >
          {t('contest', 'sendBack')}
        </button>
        {error && <span role="alert" style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>{error}</span>}
      </StoreFixedBottom>
    </div>
  );
};

export default StoreContestConfirm;
