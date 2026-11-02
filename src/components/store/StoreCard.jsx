import { X } from 'lucide-react';
import StoreThumb from './StoreThumb';
import { storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const formatDate = (iso, lang) => {
  try {
    return new Date(iso).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

/**
 * 로비의 내 매장 카드 (시안 1). 위에 대표 사진, 아래 이름·게임방·멤버.
 * STAFF 카드는 운영 안내가 붙고 X가 없다 — 해제는 관리자가 6h에서.
 * 이번 시즌 순위·점수(2단계), 이벤트 배지(5단계), 운영 끝남의 "지난 기록 보기"(4단계)는 아직 없다.
 */
const StoreCard = ({ store, onOpen, onLeave, lang, t }) => {
  const isStaff = store.role === 'STAFF';
  return (
    <div style={{ position: 'relative', width: 318, flexShrink: 0, display: 'flex', scrollSnapAlign: 'start' }}>
      <button
        onClick={() => onOpen(store)}
        style={{
          flex: 1, padding: 0, textAlign: 'left', cursor: 'pointer',
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        <StoreThumb store={store} height={96} />
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{
                fontSize: '18px', fontWeight: 700, color: store.closed ? V('--th-text-sub') : V('--th-text'),
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {storeTitle(store)}
              </span>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>
                {store.closed
                  ? t('store', 'closedSub').replace('{date}', formatDate(store.closedAt, lang))
                  : t('store', 'roomsAndMembers').replace('{rooms}', store.gameCount).replace('{members}', store.memberCount)}
              </span>
            </div>
            {store.closed && (
              <span style={{
                flexShrink: 0, fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                backgroundColor: V('--th-bg-deep'), color: V('--th-text-sub'),
              }}>
                {t('store', 'closedBadge')}
              </span>
            )}
          </div>
          {isStaff && (
            <div style={{
              borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px',
              backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`,
            }}>
              <span style={{
                alignSelf: 'flex-start', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                backgroundColor: V('--th-primary'), color: '#fff',
              }}>
                {t('store', 'staffBadge')}
              </span>
              <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-primary-dark') }}>{t('store', 'staffCardDesc')}</span>
            </div>
          )}
        </div>
      </button>
      {!isStaff && onLeave && (
        <button
          aria-label={t('store', 'leaveAria').replace('{name}', storeTitle(store))}
          onClick={() => onLeave(store)}
          style={{
            position: 'absolute', top: 8, right: 8, width: 24, height: 24, padding: 0,
            border: 'none', borderRadius: 999, cursor: 'pointer',
            backgroundColor: 'rgba(17,24,39,0.55)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};

export default StoreCard;
