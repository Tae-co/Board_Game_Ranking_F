import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyStoreContest, cancelStoreContest, getStoreContest, setContestArrived, startStoreContest, storeErrorCode,
  withdrawStoreContest,
} from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';
import { CURRENT_PARTY_KEY } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import { contestKey } from '../components/contest/contestUtils';
import ContestDetail from '../components/contest/ContestDetail';
import ContestLive from '../components/contest/ContestLive';
import ContestResult from '../components/contest/ContestResult';
import ContestStaff from '../components/contest/ContestStaff';
import { useGoBack } from '../hooks/useGoBack';
import { useApiErrorMessage } from '../hooks/useApiErrorMessage';

/**
 * 하루 대회 `/store/:storeId/contest/:contestId` — 상태·역할로 나눈다 (plan-store §2 5a·5b·5d·5e).
 * STAFF: 5e (끝났으면 5d). 손님: 모집 중 5a(당일 신청자는 5b 도착 대기) · 진행 중·취소 5b · 끝남 5d
 */
const StoreContest = () => {
  const { storeId, contestId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const errorText = useApiErrorMessage();
  const myId = Number(getAuthUserId());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: c, error: loadError } = useQuery({
    queryKey: contestKey(contestId),
    queryFn: () => getStoreContest(storeId, contestId),
    // 도착 확인·STAFF 판 확인은 다른 폰에서 일어난다. 대회 그룹 신호(usePartyRealtime)가 없는 신청자도 따라오게
    refetchInterval: 1000 * 10,
  });

  // 도착 대기(5b) 화면에 있던 사람은 STAFF가 시작하는 순간 점수판으로 (시안 5b "이 화면에 점수판이 열려요")
  const waiting = useRef(false);
  useEffect(() => {
    if (!c) return;
    if (c.status === 'RECRUITING' && c.myStatus === 'APPLIED') {
      waiting.current = true;
    } else if (waiting.current && c.status === 'PLAYING' && c.myStatus === 'PLAYING' && c.currentMatchId) {
      waiting.current = false;
      navigate(`/store/match/${c.currentMatchId}`);
    }
  }, [c, navigate]);

  const home = () => goBack(`/store/${storeId}`);
  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      if (next) queryClient.setQueryData(contestKey(contestId), next);
      queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
      queryClient.invalidateQueries({ queryKey: ['store', Number(storeId), 'home'] });
    } catch (e) {
      setError(storeErrorCode(e) ? errorText(e, t('store', 'actionFailed')) : t('store', 'actionFailed'));
      queryClient.invalidateQueries({ queryKey: contestKey(contestId) });
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <Navigate to={`/store/${storeId}`} replace />;
  if (!c) return <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }} />;

  const staff = c.viewer === 'STAFF';
  const finished = c.status === 'FINISHED';
  let view;
  if (staff && !(finished && (c.endReason === 'COMPLETED' || search.get('view') === 'result')) && c.status !== 'CANCELLED') {
    view = (
      <ContestStaff
        contest={c} busy={busy} error={error} t={t} lang={lang}
        onArrive={(memberId, arrived) => act(() => setContestArrived(storeId, contestId, memberId, arrived))}
        onStart={(recorderId) => act(() => startStoreContest(storeId, contestId, recorderId))}
        onCancel={() => act(() => cancelStoreContest(storeId, contestId))}
        onCheck={(matchId) => navigate(`/store/${storeId}/contest/${contestId}/confirm/${matchId}`)}
        onResult={() => navigate(`/store/${storeId}/contest/${contestId}?view=result`)}
      />
    );
  } else if (finished) {
    view = <ContestResult contest={c} myId={myId} onHome={home} t={t} lang={lang} />;
  } else if (c.status === 'RECRUITING' && !(c.today && c.myStatus === 'APPLIED')) {
    view = (
      <ContestDetail
        contest={c} myId={myId} busy={busy} error={error} t={t} lang={lang}
        onApply={() => act(() => applyStoreContest(storeId, contestId))}
        onWithdraw={() => act(() => withdrawStoreContest(storeId, contestId))}
      />
    );
  } else {
    view = (
      <ContestLive
        contest={c} myId={myId} t={t} lang={lang}
        onSheet={(matchId) => navigate(`/store/match/${matchId}`)}
        onHome={home}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('contest', staff ? 'staffTitle' : 'title')} onBack={home} backLabel={t('common', 'back')} />
      <div style={{ maxWidth: 430, margin: '0 auto' }}>{view}</div>
    </div>
  );
};

export default StoreContest;
