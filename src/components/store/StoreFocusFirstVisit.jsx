import { StoreDirectoryPreview } from './MyStoreSection';
import { QrIcon } from './StoreIcons';
import { V } from '../../utils/cssUtils';

/** 1e 매장만 고른 첫 화면: 빈 내 매장 자리에 QR 안내, 입점 매장, 모임 만들기·초대코드는 작게 */
const StoreFocusFirstVisit = ({ onFindStores, onCreateCommunity, onJoinCommunity, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'myStores')}</h2>
      <div style={{
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
        padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center',
      }}>
        <span style={{ width: 56, height: 56, borderRadius: '16px', backgroundColor: '#E7F6EC', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrIcon size={28} />
        </span>
        <span style={{ fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'storeFocusTitle')}</span>
        <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub'), whiteSpace: 'pre-line' }}>
          <b style={{ color: V('--th-text') }}>{t('store', 'storeFocusCamera')}</b>{t('store', 'storeFocusDesc')}
        </span>
        <span style={{ alignSelf: 'stretch', fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub'), backgroundColor: V('--th-bg'), borderRadius: '12px', padding: '10px 12px' }}>
          {t('store', 'storeFocusInstalled')}
        </span>
        <button
          onClick={onFindStores}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 700, color: V('--th-primary') }}
        >
          {t('store', 'storeFocusFind')}
        </button>
      </div>
    </section>
    <StoreDirectoryPreview t={t} />
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('community', 'joinedCommunities')}</h2>
      <div style={{
        backgroundColor: V('--th-card'), border: '1px dashed #D1D5DB', borderRadius: '20px',
        padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'storeFocusOther')}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCreateCommunity}
            style={{
              flex: 1, height: 44, borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`, color: V('--th-primary'),
            }}
          >
            {t('community', 'firstVisitCreate')}
          </button>
          <button
            onClick={onJoinCommunity}
            style={{
              flex: 1, height: 44, borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'), color: V('--th-text'),
            }}
          >
            {t('store', 'storeFocusJoin')}
          </button>
        </div>
      </div>
    </section>
  </div>
);

export default StoreFocusFirstVisit;
