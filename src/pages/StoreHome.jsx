import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, QrCode } from 'lucide-react';
import { getStoreHome, storeErrorCode } from '../api/services/stores';
import { storeTitle } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreHeader from '../components/store/StoreHeader';
import StoreGameGrid from '../components/store/StoreGameGrid';
import StoreCheckinNotice from '../components/store/StoreCheckinNotice';
import StoreVisitorFooter from '../components/store/StoreVisitorFooter';
import StoreQrProblem from '../components/store/StoreQrProblem';
import { Skeleton } from '../components/Skeleton';

const Toast = ({ title, desc, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', left: 16, right: 16, zIndex: 300,
      top: 'calc(env(safe-area-inset-top) + 72px)',
      maxWidth: 358, margin: '0 auto',
      padding: '14px 16px', borderRadius: '16px',
      background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
      color: '#fff', boxShadow: '0 8px 24px rgba(107,92,231,0.35)',
    }}
  >
    <p style={{ fontSize: '15px', fontWeight: '800', margin: desc ? '0 0 3px' : 0 }}>{title}</p>
    {desc && <p style={{ fontSize: '12px', margin: 0, opacity: 0.85 }}>{desc}</p>}
  </div>
);

/**
 * 매장 홈 `/store/:storeId` — 2(멤버·STAFF) · 2d(구경) · 2j(방금 가입). viewer.role로 나눈다.
 * 오늘의 그룹·게임별 랭킹·MVP(2단계), 기기 관리(3단계), 리포트·신고 카드(4단계), 대회·이벤트(5단계)는 아직 없다.
 */
const StoreHome = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const [toast, setToast] = useState(() => (location.state?.justJoined ? 'joined' : null));

  const { data: home, isLoading, error, refetch } = useQuery({
    queryKey: ['store', Number(storeId), 'home'],
    queryFn: () => getStoreHome(storeId),
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (error && !home) {
    const notFound = storeErrorCode(error) === 'STORE_NOT_FOUND';
    return (
      <StoreQrProblem
        kind={notFound ? 'notFound' : 'failed'}
        primary={notFound ? null : { label: t('store', 'retry'), onClick: () => refetch() }}
        secondary={{ label: t('store', 'goHome'), onClick: () => navigate('/community', { replace: true }) }}
        t={t}
      />
    );
  }

  const role = home?.viewer.role;
  const isVisitor = role === 'VISITOR' || role === 'STAFF_OTHER';
  const store = home?.store;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      {toast === 'joined' && store && (
        <Toast
          title={t('store', 'joinedToastTitle').replace('{name}', storeTitle(store))}
          desc={t('store', 'joinedToastDesc')}
          onClose={() => setToast(null)}
        />
      )}
      {toast === 'soon' && <Toast title={t('store', 'comingSoon')} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px' }}>
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-primary'), display: 'flex' }}
          >
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {store ? storeTitle(store) : ''}
          </span>
          {role === 'STAFF' && (
            <span style={{
              flexShrink: 0, fontSize: '11px', fontWeight: '700', color: '#fff',
              backgroundColor: V('--th-primary'), borderRadius: '20px', padding: '1px 8px',
            }}>
              {t('store', 'staffBadge')}
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 40px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={160} radius={20} />
            <Skeleton width="40%" height={16} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[0, 1, 2, 3].map(i => <Skeleton key={i} height={60} radius={14} />)}
            </div>
          </div>
        ) : (
          <>
            {store.closed && (
              <div style={{
                padding: '12px 14px', borderRadius: '12px', marginBottom: '16px',
                backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
                fontSize: '13px', fontWeight: '600', color: V('--th-text-sub'),
              }}>
                {t('store', 'closedNotice')}
              </div>
            )}

            <StoreHeader store={store} memberCount={home.memberCount} t={t} />

            {role === 'MEMBER' && home.viewer.checkin?.active && (
              <StoreCheckinNotice checkin={home.viewer.checkin} region={store.region} lang={lang} t={t} />
            )}

            {role === 'STAFF' && !store.closed && (
              <button
                onClick={() => navigate(`/store/${storeId}/checkin-qr`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px', borderRadius: '16px', marginBottom: '20px',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: 'linear-gradient(135deg, #5B4EDA 0%, #7B8FF5 100%)',
                  boxShadow: '0 4px 16px rgba(107,92,231,0.3)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={20} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 2px' }}>{t('store', 'staffQrButton')}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{t('store', 'staffQrButtonDesc')}</p>
                </div>
              </button>
            )}

            <StoreGameGrid games={home.games} onGameClick={() => setToast('soon')} t={t} />

            {role === 'MEMBER' && !home.viewer.checkin?.active && !store.closed && (
              <StoreCheckinNotice checkin={home.viewer.checkin} region={store.region} lang={lang} t={t} />
            )}

            {isVisitor && <StoreVisitorFooter role={role} t={t} />}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreHome;
