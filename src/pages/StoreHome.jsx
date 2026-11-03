import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createParty, getStoreHome, markStoreResetSeen, storeErrorCode } from '../api/services/stores';
import { CURRENT_PARTY_KEY } from '../hooks/useCurrentParty';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreHeader, { StorePhoto } from '../components/store/StoreHeader';
import StoreGameGrid from '../components/store/StoreGameGrid';
import StoreBottomBar from '../components/store/StoreBottomBar';
import StoreQrProblem from '../components/store/StoreQrProblem';
import StorePartyCard from '../components/store/StorePartyCard';
import StoreMvp from '../components/store/StoreMvp';
import StoreGameRankings from '../components/store/StoreGameRankings';
import { ChartIcon, MonitorIcon, QrIcon, ShopIcon } from '../components/store/StoreIcons';
import StoreClosedView from '../components/store/StoreClosedView';
import StoreEventCards from '../components/contest/StoreEventCards';
import { fmt } from '../components/store/fmt';
import { Skeleton } from '../components/Skeleton';

const noteStyle = {
  fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub'),
  backgroundColor: V('--th-bg-deep'), borderRadius: '12px', padding: '10px 12px',
};

/**
 * 매장 홈 `/store/:storeId` — 2(멤버·STAFF) · 2d(구경) · 2j(방금 가입) · 2h(운영 끝남). viewer.role로 나눈다.
 */
/** 10/30 14:20 */
const matchWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const StoreHome = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [resetDismissed, setResetDismissed] = useState(false);

  const { data: home, isLoading, error, refetch } = useQuery({
    queryKey: ['store', Number(storeId), 'home'],
    queryFn: () => getStoreHome(storeId),
    staleTime: 1000 * 30,
  });

  const goCommunity = () => navigate('/community');

  // 신고 초기화 안내 카드(2)는 확인을 누르면 다시 안 뜬다
  const dismissReset = () => {
    setResetDismissed(true);
    markStoreResetSeen(storeId).catch(() => {});
  };

  const handleCreateParty = async () => {
    setCreating(true);
    setActionError(null);
    try {
      await createParty(storeId);
      await queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
      queryClient.invalidateQueries({ queryKey: ['store', Number(storeId), 'home'] });
      navigate(`/store/${storeId}/party`);
    } catch (e) {
      const code = storeErrorCode(e);
      setActionError(code === 'NOT_CHECKED_IN' ? t('store', 'blockNotCheckedIn') : t('store', 'actionFailed'));
      if (code === 'NOT_CHECKED_IN') refetch();
    } finally {
      setCreating(false);
    }
  };

  if (error && !home) {
    const notFound = storeErrorCode(error) === 'STORE_NOT_FOUND';
    return (
      <StoreQrProblem
        kind={notFound ? 'notFound' : 'failed'}
        primary={notFound
          ? { label: t('store', 'goHome'), onClick: () => navigate('/community', { replace: true }) }
          : { label: t('store', 'retry'), onClick: () => refetch() }}
        onBack={() => navigate('/community', { replace: true })}
        t={t}
      />
    );
  }

  const role = home?.viewer.role;
  const isVisitor = role === 'VISITOR' || role === 'STAFF_OTHER';
  const store = home?.store;
  const checkinExpired = role === 'MEMBER' && !home.viewer.checkin?.active && !store.closed;

  let bottomBar = null;
  if (role === 'STAFF_OTHER') {
    bottomBar = <StoreBottomBar icon={false} title={t('store', 'staffOtherTitle')} desc={t('store', 'staffOtherDesc')} />;
  } else if (role === 'VISITOR' && !store.closed) {
    bottomBar = <StoreBottomBar title={t('store', 'qrBar')} />;
  } else if (checkinExpired) {
    bottomBar = <StoreBottomBar title={t('store', 'qrBar')} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>

      <StoreTopBar title={t('store', 'storeTitle')} onBack={goCommunity} showProfile backLabel={t('common', 'back')} />

      <div style={{ maxWidth: 430, margin: '0 auto' }}>
        {isLoading ? (
          <>
            <Skeleton height={180} radius={0} />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={14} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[0, 1, 2, 3].map(i => <Skeleton key={i} height={140} radius={16} />)}
              </div>
            </div>
          </>
        ) : store.closed ? (
          <StoreClosedView home={home} lang={lang} t={t} />
        ) : (
          <>
            <StorePhoto store={store} />
            <main style={{
              boxSizing: 'border-box', padding: bottomBar ? (role === 'STAFF_OTHER' ? '20px 20px 150px' : '20px 20px 110px') : '20px 20px 40px',
              display: 'flex', flexDirection: 'column', gap: '28px',
            }}>
              {home.resetNotice && !resetDismissed && (
                <section role="status" style={{
                  backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '20px', padding: '16px 18px',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#9A3412' }}>
                    {fmt(t('store', 'resetNoticeTitle'), { game: home.resetNotice.gameName })}
                  </span>
                  <span style={{ fontSize: '13px', lineHeight: 1.55, color: '#7C2D12' }}>
                    {fmt(t('store', 'resetNoticeBody'), { when: matchWhen(home.resetNotice.matchEndedAt), game: home.resetNotice.gameName })}
                  </span>
                  <span style={{ fontSize: '12px', lineHeight: 1.5, color: '#9A3412' }}>{t('store', 'resetNoticeHelp')}</span>
                  <button onClick={dismissReset} style={{
                    alignSelf: 'flex-end', height: 40, padding: '0 18px', border: 'none', borderRadius: '12px', cursor: 'pointer',
                    backgroundColor: '#FFFFFF', color: '#9A3412', fontSize: '14px', fontWeight: 700,
                  }}>{t('store', 'infoOk')}</button>
                </section>
              )}

              <StoreHeader
                store={store}
                memberCount={home.memberCount}
                gameCount={home.games.length}
                showAddress={isVisitor}
                t={t}
              />

              {isVisitor && (
                <section style={{
                  backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`,
                  border: `1px solid rgba(${V('--th-primary-rgb')}, 0.25)`,
                  borderRadius: '20px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                    backgroundColor: V('--th-primary'), color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ShopIcon size={20} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'visitorBannerTitle')}</span>
                    <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text') }}>{t('store', 'visitorBannerDesc')}</span>
                  </span>
                </section>
              )}

              {role === 'MEMBER' && !store.closed && (
                <StorePartyCard
                  party={home.party}
                  onManage={() => navigate(`/store/${storeId}/party/manage`)}
                  onCreate={handleCreateParty}
                  onJoin={() => navigate(`/store/${storeId}/party/join`)}
                  creating={creating}
                  t={t}
                />
              )}
              {actionError && <span role="status" style={{ ...noteStyle, color: '#B91C1C' }}>{actionError}</span>}

              {role === 'STAFF' && <span style={noteStyle}>{t('store', 'staffNoPlay')}</span>}

              {role === 'STAFF' && !store.closed && (
                <section style={{
                  backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`,
                  border: `1px dashed rgba(${V('--th-primary-rgb')}, 0.5)`,
                  borderRadius: '20px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: V('--th-primary') }}>{t('store', 'staffOnly')}</span>
                  <button
                    onClick={() => navigate(`/store/${storeId}/devices`)}
                    style={{
                      height: 52, borderRadius: '14px', cursor: 'pointer', border: 'none',
                      backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <MonitorIcon />
                    {t('store', 'staffDevicesButton')}
                  </button>
                  <button
                    onClick={() => navigate(`/store/${storeId}/checkin-qr`)}
                    style={{
                      height: 48, borderRadius: '14px', cursor: 'pointer',
                      backgroundColor: V('--th-card'), border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`,
                      color: V('--th-primary'), fontSize: '15px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <QrIcon />
                    {t('store', 'staffQrButton')}
                  </button>
                  <button
                    onClick={() => navigate(`/store/${storeId}/report`)}
                    style={{
                      height: 48, borderRadius: '14px', cursor: 'pointer',
                      backgroundColor: V('--th-card'), border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`,
                      color: V('--th-primary'), fontSize: '15px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <ChartIcon />
                    {t('store', 'staffReportButton')}
                  </button>
                </section>
              )}

              <StoreEventCards storeId={storeId} contests={home.contests} events={home.events} role={role} t={t} lang={lang} />

              <StoreMvp mvp={home.mvp} t={t} />

              <StoreGameRankings
                rankings={home.rankings}
                onMore={(roomId) => navigate(`/store/${storeId}/rooms/${roomId}/ranking`)}
                t={t}
              />

              {/* 게임방은 체크인이 살아 있는 멤버만. STAFF·구경은 눌러도 안 간다 (plan-store §2 2·2d) */}
              <StoreGameGrid
                games={home.games}
                showCount={isVisitor}
                onGameClick={role === 'MEMBER' && !checkinExpired && !store.closed
                  ? (game) => navigate(`/store/${storeId}/rooms/${game.storeRoomId}`)
                  : undefined}
                onMore={isVisitor ? undefined : () => navigate(`/store/${storeId}/games`)}
                t={t}
              />
            </main>
          </>
        )}
      </div>

      {bottomBar}
    </div>
  );
};

export default StoreHome;
