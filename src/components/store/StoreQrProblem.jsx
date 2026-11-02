import { V } from '../../utils/cssUtils';
import StoreTopBar from './StoreTopBar';
import { BadQrIcon } from './StoreIcons';

// kind → [제목 키, 설명 키]
const KINDS = {
  expired: ['qrExpiredTitle', 'qrExpiredDesc'],
  ticket: ['ticketExpiredTitle', 'ticketExpiredDesc'],
  closed: ['storeClosedTitle', 'storeClosedDesc'],
  notFound: ['storeNotFoundTitle', null],
  failed: ['loadFailedTitle', 'loadFailedDesc'],
};

/**
 * 1f 쓸 수 없는 QR (+ 매장을 못 찾거나 못 불러온 경우).
 * 운영 끝난 매장의 "지난 기록 보기"(2h)는 4단계 — 그 전엔 홈으로만 보낸다.
 */
const StoreQrProblem = ({ kind, storeName, primary, onBack, t }) => {
  const [titleKey, descKey] = KINDS[kind];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('store', 'qrProblemHeader')} onBack={onBack} backLabel={t('common', 'back')} />
      <main style={{
        flex: 1, boxSizing: 'border-box', padding: '48px 24px 120px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center',
      }}>
        <span style={{
          width: 64, height: 64, borderRadius: '20px', backgroundColor: '#FFF1E6', color: '#B4500A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BadQrIcon />
        </span>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{t('store', titleKey)}</h1>
        {descKey && (
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: V('--th-text-sub') }}>{t('store', descKey)}</p>
        )}
        {storeName && <span style={{ fontSize: '14px', fontWeight: 700, color: V('--th-text') }}>{storeName}</span>}
      </main>
      {primary && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, boxSizing: 'border-box',
          padding: '12px 20px calc(28px + env(safe-area-inset-bottom))',
          backgroundColor: V('--th-nav-bg'), borderTop: `1px solid ${V('--th-border')}`,
        }}>
          <button
            onClick={primary.onClick}
            style={{
              width: '100%', maxWidth: 390, margin: '0 auto', display: 'block', height: 52,
              borderRadius: '14px', border: 'none', cursor: 'pointer',
              backgroundColor: V('--th-primary'), color: '#fff', fontSize: '16px', fontWeight: 700,
            }}
          >
            {primary.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreQrProblem;
