import { Gamepad2, Users, X } from 'lucide-react';
import StoreThumb from './StoreThumb';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const Badge = ({ children, filled }) => (
  <span style={{
    flexShrink: 0, fontSize: '11px', fontWeight: '700',
    borderRadius: '20px', padding: '1px 8px',
    color: filled ? '#fff' : V('--th-text-sub'),
    backgroundColor: filled ? V('--th-primary') : V('--th-bg'),
    border: `1px solid ${filled ? V('--th-primary') : V('--th-border')}`,
  }}>
    {children}
  </span>
);

/**
 * 로비의 내 매장 카드 (시안 1). STAFF 카드는 배지만 있고 X가 없다 — 해제는 관리자가 6h에서.
 * 이번 시즌 순위·점수(2단계), 이벤트 배지(5단계)는 아직 없다.
 */
const StoreCard = ({ store, onOpen, onLeave, t }) => {
  const isStaff = store.role === 'STAFF';
  return (
    <div
      onClick={() => onOpen(store)}
      style={{
        position: 'relative', cursor: 'pointer',
        borderRadius: '18px', padding: '16px',
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}
    >
      <StoreThumb store={store} size={56} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingRight: onLeave && !isStaff ? 24 : 0 }}>
          <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storeTitle(store)}
          </p>
          {isStaff && <Badge filled>{t('store', 'staffBadge')}</Badge>}
          {store.closed && <Badge>{t('store', 'closedBadge')}</Badge>}
        </div>
        <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Gamepad2 size={13} />{t('store', 'gameCount').replace('{n}', store.gameCount)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Users size={13} />{t('store', 'memberCount').replace('{n}', store.memberCount)}
          </span>
        </p>
      </div>
      {!isStaff && onLeave && (
        <button
          aria-label={t('store', 'leaveAria')}
          onClick={(e) => { e.stopPropagation(); onLeave(store); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 26, height: 26, borderRadius: '50%',
            border: 'none', cursor: 'pointer', backgroundColor: V('--th-bg'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: V('--th-text-sub'),
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default StoreCard;
