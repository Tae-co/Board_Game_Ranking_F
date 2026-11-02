import StoreQrHint from './StoreQrHint';

/** 2d 구경 하단. 지정되지 않은 매장을 연 STAFF 계정은 QR 안내 대신 "구경만" 문구 */
const StoreVisitorFooter = ({ role, t }) => (
  <div style={{
    position: 'sticky', bottom: 0, paddingTop: '12px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  }}>
    <StoreQrHint text={t('store', role === 'STAFF_OTHER' ? 'staffOtherFooter' : 'visitorFooter')} />
  </div>
);

export default StoreVisitorFooter;
