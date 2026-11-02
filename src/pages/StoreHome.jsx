import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreHome, storeErrorCode } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreHeader, { StorePhoto } from '../components/store/StoreHeader';
import StoreGameGrid from '../components/store/StoreGameGrid';
import StoreBottomBar from '../components/store/StoreBottomBar';
import StoreQrProblem from '../components/store/StoreQrProblem';
import { QrIcon, ShopIcon } from '../components/store/StoreIcons';
import { Skeleton } from '../components/Skeleton';

const Toast = ({ title, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', left: 16, right: 16, zIndex: 300,
      top: 'calc(env(safe-area-inset-top) + 68px)',
      maxWidth: 358, margin: '0 auto',
      padding: '14px 16px', borderRadius: '16px',
      backgroundColor: V('--th-text'), color: V('--th-card'),
      fontSize: '14px', fontWeight: 700, textAlign: 'center',
    }}
  >
    {title}
  </div>
);

const noteStyle = {
  fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub'),
  backgroundColor: V('--th-bg-deep'), borderRadius: '12px', padding: '10px 12px',
};

/**
 * 매장 홈 `/store/:storeId` — 2(멤버·STAFF) · 2d(구경) · 2j(방금 가입). viewer.role로 나눈다.
 * 오늘의 그룹·게임별 랭킹·MVP(2단계), 기기 관리(3단계), 리포트·신고 카드(4단계), 대회·이벤트(5단계)는 아직 없다.
 */
const StoreHome = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [toast, setToast] = useState(false);

  const { data: home, isLoading, error, refetch } = useQuery({
    queryKey: ['store', Number(storeId), 'home'],
    queryFn: () => getStoreHome(storeId),
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const goCommunity = () => navigate('/community');

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
    bottomBar = <StoreBottomBar title={t('store', 'visitorBarTitle')} desc={t('store', 'visitorBarDesc')} note={t('store', 'visitorBarNote')} />;
  } else if (checkinExpired) {
    bottomBar = <StoreBottomBar title={t('store', 'checkinExpiredTitle')} desc={t('store', 'checkinExpiredDesc')} note={t('store', 'checkinExpiredNote')} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      {toast && <Toast title={t('store', 'comingSoon')} onClose={() => setToast(false)} />}

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
        ) : (
          <>
            <StorePhoto store={store} />
            <main style={{
              boxSizing: 'border-box', padding: bottomBar ? '20px 20px 150px' : '20px 20px 40px',
              display: 'flex', flexDirection: 'column', gap: '28px',
            }}>
              {store.closed && <span style={noteStyle}>{t('store', 'closedNotice')}</span>}

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

              {role === 'STAFF' && <span style={noteStyle}>{t('store', 'staffNoPlay')}</span>}

              {role === 'STAFF' && !store.closed && (
                <section style={{
                  backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`,
                  border: `1px dashed rgba(${V('--th-primary-rgb')}, 0.5)`,
                  borderRadius: '20px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: V('--th-primary') }}>{t('store', 'staffOnly')}</span>
                  {/* 매장 기기 추가·관리(3단계), 월간 리포트(4단계)는 여기 더한다 */}
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
                </section>
              )}

              <StoreGameGrid
                games={home.games}
                showCount={isVisitor}
                onGameClick={isVisitor ? undefined : () => setToast(true)}
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
