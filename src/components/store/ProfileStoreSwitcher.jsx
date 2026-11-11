import { V } from '../../utils/cssUtils';

/**
 * 프로필 매장 탭 (plan-store 7): [일반 / 매장] 기록 탭, 매장 탭이면 가입한 매장 고르는 칩.
 * 가입한 매장이 있을 때만 그린다.
 */
const ProfileStoreSwitcher = ({ isStore, onModeChange, storeProfiles, currentStoreId, onStoreSelect, t }) => (
  <>
    <div role="tablist" aria-label={t('profile', 'recordKind')} style={{
      width: '100%', boxSizing: 'border-box', display: 'flex', gap: 4, padding: 4,
      backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`, borderRadius: 999,
    }}>
      {[['general', 'tabGeneral'], ['store', 'tabStore']].map(([key, label]) => {
        const on = (key === 'store') === isStore;
        return (
          <button key={key} role="tab" aria-selected={on} onClick={() => onModeChange(key)} style={{
            flex: 1, height: 36, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 700,
            backgroundColor: on ? 'var(--th-primary)' : 'transparent', color: on ? '#fff' : V('--th-text-sub'),
          }}>{t('profile', label)}</button>
        );
      })}
    </div>

    {isStore && (
      <div style={{ width: '100%', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {storeProfiles.map((sp, i) => {
          const on = sp.storeId === currentStoreId;
          return (
            <button key={sp.storeId} onClick={() => onStoreSelect(i)} aria-pressed={on} style={{
              height: 34, padding: '0 14px', flexShrink: 0, borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              border: `1px solid ${on ? 'var(--th-primary)' : 'var(--th-border)'}`,
              backgroundColor: on ? 'rgba(var(--th-primary-rgb), 0.12)' : V('--th-card'), color: on ? 'var(--th-primary)' : V('--th-text-sub'),
            }}>{[sp.name, sp.branch].filter(Boolean).join(' ')}</button>
          );
        })}
      </div>
    )}
  </>
);

export default ProfileStoreSwitcher;
