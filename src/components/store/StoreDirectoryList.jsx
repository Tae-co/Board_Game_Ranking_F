import StoreThumb from './StoreThumb';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import { ChevronRightIcon } from './StoreIcons';

/** 1g 입점 매장 줄 목록 (한 동네 묶음). 가입한 매장엔 "가입함" */
const StoreDirectoryList = ({ stores, onOpen, t }) => (
  <div style={{
    borderRadius: '20px', padding: '4px 16px',
    backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
  }}>
    {stores.map((store, i) => (
      <button
        key={store.id}
        onClick={() => onOpen(store)}
        style={{
          width: '100%', minHeight: 64, display: 'flex', alignItems: 'center', gap: '12px',
          padding: 0, textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none',
          borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}`,
        }}
      >
        <StoreThumb store={store} size={40} radius={10} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storeTitle(store)}
          </span>
          <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
            {t('store', 'roomsAndMembers').replace('{rooms}', store.gameCount).replace('{members}', store.memberCount)}
          </span>
        </span>
        {store.joined && (
          <span style={{
            flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary'),
          }}>
            {t('store', 'joinedBadge')}
          </span>
        )}
        <span style={{ flexShrink: 0, display: 'flex', color: '#9CA3AF' }}><ChevronRightIcon /></span>
      </button>
    ))}
  </div>
);

export default StoreDirectoryList;
