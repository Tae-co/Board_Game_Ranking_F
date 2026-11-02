import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { checkInStore, getStoreHome, joinStore, scanStore, storeErrorCode } from '../api/services/stores';
import { getAuthUserId } from '../auth/storage';
import { clearPendingStoreTicket, getPendingStoreTicket, setPendingStoreTicket } from '../utils/storage';
import { MY_STORES_KEY, useMyStores } from '../hooks/useMyStores';
import { STORE_CONSENT_VERSION, storeTitle } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreJoinSheet from '../components/store/StoreJoinSheet';
import StoreQrProblem from '../components/store/StoreQrProblem';

const TICKET_ERRORS = ['TICKET_INVALID', 'TICKET_EXPIRED'];

/**
 * 매장 QR·공유 링크 진입 `/s/:storeId?t=TOKEN` (plan-store-impl-p1 §4.2).
 * QR은 찍은 순간 한 번만 확인하고 티켓으로 바꿔 둔다 — 로그인·동의 중에 QR이 바뀌어도 그대로 가입·체크인된다.
 */
const StoreEntry = () => {
  const { storeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const started = useRef(false);
  const { data: myStores = [] } = useMyStores();

  const [problem, setProblem] = useState(null);   // { kind, storeName }
  const [consentStore, setConsentStore] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // 재시도(run)가 이미 확인한 토큰을 다시 보내지 않도록 주소가 아니라 ref에서 읽는다
  const tokenRef = useRef(searchParams.get('t'));

  const goHome = () => navigate(`/store/${storeId}`, { replace: true });
  const goLogin = () => navigate('/login', { replace: true, state: { redirectAfterLogin: `/s/${storeId}` } });

  const pendingTicket = () => {
    const pending = getPendingStoreTicket();
    return pending?.storeId === Number(storeId) ? pending.ticket : null;
  };

  const ticketProblem = (code, storeName) => {
    clearPendingStoreTicket();
    if (TICKET_ERRORS.includes(code)) setProblem({ kind: 'ticket', storeName });
    else if (code === 'STORE_CLOSED') setProblem({ kind: 'closed', storeName });
    else return false;
    return true;
  };

  const run = async () => {
    const token = tokenRef.current;

    if (token) {
      let scan;
      try {
        scan = await scanStore(storeId, token);
      } catch (e) {
        setProblem({ kind: e?.response?.status === 404 ? 'notFound' : 'failed' });
        return;
      }
      const storeName = storeTitle(scan.store);
      if (scan.result === 'EXPIRED_QR') { setProblem({ kind: 'expired', storeName }); return; }
      if (scan.result === 'STORE_CLOSED') { clearPendingStoreTicket(); setProblem({ kind: 'closed', storeName }); return; }
      setPendingStoreTicket(storeId, scan.ticket);
      tokenRef.current = null;
      // 새로고침·뒤로 가기로 같은 토큰을 다시 확인하면 그새 정각이 지나 1f가 뜬다 — 주소에서 지운다
      navigate(`/s/${storeId}`, { replace: true });
    }

    if (!getAuthUserId()) { goLogin(); return; }

    let home;
    try {
      home = await getStoreHome(storeId);
    } catch (e) {
      setProblem({ kind: storeErrorCode(e) === 'STORE_NOT_FOUND' ? 'notFound' : 'failed' });
      return;
    }
    queryClient.setQueryData(['store', Number(storeId), 'home'], home);

    const ticket = pendingTicket();
    const role = home.viewer.role;

    if (role === 'MEMBER' && ticket) {
      try {
        await checkInStore(storeId, ticket);
      } catch (e) {
        if (ticketProblem(storeErrorCode(e), storeTitle(home.store))) return;
      }
      clearPendingStoreTicket();
      queryClient.invalidateQueries({ queryKey: ['store', Number(storeId), 'home'] });
      goHome();
      return;
    }

    if (role === 'VISITOR' && ticket && !home.store.closed) {
      setConsentStore(home.store);
      return;
    }

    // STAFF(지정 매장) → 2, STAFF_OTHER → 2d 하단 문구, 티켓 없는 공유 링크 → 2 또는 2d. 홈이 역할로 나눈다
    clearPendingStoreTicket();
    goHome();
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    const ticket = pendingTicket();
    setJoining(true);
    setJoinError('');
    try {
      await joinStore(storeId, ticket, STORE_CONSENT_VERSION);
      clearPendingStoreTicket();
      queryClient.invalidateQueries({ queryKey: MY_STORES_KEY });
      queryClient.invalidateQueries({ queryKey: ['stores', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['store', Number(storeId), 'home'] });
      navigate(`/store/${storeId}`, { replace: true });
    } catch (e) {
      const code = storeErrorCode(e);
      if (ticketProblem(code, storeTitle(consentStore))) { setConsentStore(null); return; }
      if (code === 'STAFF_CANNOT_JOIN') { clearPendingStoreTicket(); goHome(); return; }
      setJoinError(e?.response?.data?.message || t('store', 'joinFailed'));
      setJoining(false);
    }
  };

  // 동의하지 않으면 가입하지 않고 앱 홈으로. 다시 가입하려면 QR을 다시 찍는다 (plan-store §2 1b)
  const handleCancel = () => {
    clearPendingStoreTicket();
    navigate('/community', { replace: true });
  };

  if (problem) {
    const { kind, storeName } = problem;
    const goCommunity = () => navigate('/community', { replace: true });
    // 시간 지난 QR은 멤버면 매장 홈, 아니면 구경. 로그인 전이면 로그인 뒤에 홈이 역할로 판단한다
    const isMember = myStores.some(s => s.id === Number(storeId));
    const primary = kind === 'expired' || kind === 'ticket'
      ? { label: t('store', isMember ? 'goStoreHome' : 'viewStore'), onClick: getAuthUserId() ? goHome : goLogin }
      : kind === 'failed'
        ? { label: t('store', 'retry'), onClick: () => { setProblem(null); run(); } }
        : { label: t('store', 'goHome'), onClick: goCommunity };
    return (
      <StoreQrProblem
        kind={kind}
        storeName={storeName}
        primary={primary}
        onBack={goCommunity}
        t={t}
      />
    );
  }

  if (consentStore) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
        <StoreJoinSheet
          store={consentStore}
          joining={joining}
          error={joinError}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          t={t}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: V('--th-bg') }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid ${V('--th-primary')}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
};

export default StoreEntry;
