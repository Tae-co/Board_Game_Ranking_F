import { V } from '../../utils/cssUtils';
import { BackIcon, NextIcon } from '../store/StoreIcons';

const WINDOW = 5; // 번호는 최대 5개만 (현재 쪽 가운데)

/** 어드민 목록 밑 쪽 번호 (‹ 1 2 3 ›). 한 쪽뿐이면 안 보인다 */
const AdminPager = ({ cur, pageCount, go, label, t }) => {
  if (pageCount <= 1) return null;
  const start = Math.max(0, Math.min(cur - Math.floor(WINDOW / 2), pageCount - WINDOW));
  const pages = Array.from({ length: Math.min(WINDOW, pageCount) }, (_, i) => start + i);
  const arrow = (disabled) => ({
    width: 40, height: 40, border: 'none', borderRadius: 999, background: 'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? V('--th-border') : V('--th-primary'), display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  return (
    <nav aria-label={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <button onClick={() => go(cur - 1)} disabled={cur === 0} aria-label={t('store', 'prevPage')} style={arrow(cur === 0)}>
        <BackIcon size={18} />
      </button>
      {pages.map(i => (
        <button key={i} onClick={() => go(i)} aria-current={i === cur ? 'page' : undefined} style={{
          width: 40, height: 40, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          backgroundColor: i === cur ? V('--th-primary') : 'transparent', color: i === cur ? '#fff' : V('--th-text-sub'),
        }}>{i + 1}</button>
      ))}
      <button onClick={() => go(cur + 1)} disabled={cur === pageCount - 1} aria-label={t('store', 'nextPage')} style={arrow(cur === pageCount - 1)}>
        <NextIcon />
      </button>
    </nav>
  );
};

export default AdminPager;
