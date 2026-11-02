import { Clock, Store as StoreIcon, WifiOff } from 'lucide-react';
import { V } from '../../utils/cssUtils';

// kind → [아이콘, 제목 키, 설명 키]
const KINDS = {
  expired: [Clock, 'qrExpiredTitle', 'qrExpiredDesc'],
  ticket: [Clock, 'ticketExpiredTitle', 'ticketExpiredDesc'],
  closed: [StoreIcon, 'storeClosedTitle', 'storeClosedDesc'],
  notFound: [StoreIcon, 'storeNotFoundTitle', null],
  failed: [WifiOff, 'loadFailedTitle', 'loadFailedDesc'],
};

/**
 * 1f 쓸 수 없는 QR (+ 매장을 못 찾거나 못 불러온 경우).
 * 운영 끝난 매장의 "지난 기록 보기"(2h)는 4단계 — 그 전엔 홈으로만 보낸다.
 */
const StoreQrProblem = ({ kind, storeName, primary, secondary, t }) => {
  const [Icon, titleKey, descKey] = KINDS[kind];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: V('--th-bg') }}>
      <div style={{
        backgroundColor: V('--th-card'), borderRadius: '20px',
        padding: '32px 24px 24px', width: '100%', maxWidth: '340px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '18px', margin: '0 auto 16px',
          backgroundColor: V('--th-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={26} color={V('--th-primary')} />
        </div>
        {storeName && (
          <p style={{ fontSize: '13px', fontWeight: '600', color: V('--th-text-sub'), margin: '0 0 6px' }}>{storeName}</p>
        )}
        <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 8px' }}>{t('store', titleKey)}</p>
        {descKey && (
          <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.6 }}>{t('store', descKey)}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
          {primary && (
            <button
              onClick={primary.onClick}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
              }}
            >
              {primary.label}
            </button>
          )}
          {secondary && (
            <button
              onClick={secondary.onClick}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', cursor: 'pointer',
                border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-bg'),
                color: V('--th-text'), fontSize: '14px', fontWeight: '700',
              }}
            >
              {secondary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreQrProblem;
