import { ChevronRight } from 'lucide-react';
import StoreThumb from './StoreThumb';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

/** 입점 매장 줄 목록 (로비 1 · 1e, 전체 보기 1g). 가입한 매장엔 "가입함" */
const StoreDirectoryList = ({ stores, onOpen, t }) => (
  <div style={{
    borderRadius: '16px', overflow: 'hidden',
    backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
  }}>
    {stores.map((store, i) => (
      <button
        key={store.id}
        onClick={() => onOpen(store)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
          background: 'none', border: 'none',
          borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}`,
        }}
      >
        <StoreThumb store={store} size={40} radius={10} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storeTitle(store)}
          </p>
          <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {store.address} · {t('store', 'memberCount').replace('{n}', store.memberCount)}
          </p>
        </div>
        {store.joined ? (
          <span style={{
            flexShrink: 0, fontSize: '11px', fontWeight: '700', color: V('--th-primary'),
            border: `1px solid ${V('--th-primary')}`, borderRadius: '20px', padding: '1px 8px',
          }}>
            {t('store', 'joinedBadge')}
          </span>
        ) : (
          <ChevronRight size={16} color={V('--th-text-sub')} style={{ flexShrink: 0 }} />
        )}
      </button>
    ))}
  </div>
);

export default StoreDirectoryList;
