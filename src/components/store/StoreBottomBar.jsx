import { V } from '../../utils/cssUtils';
import { CameraIcon } from './StoreIcons';

/**
 * 매장 홈 아래 고정 안내 (시안 2 체크인 만료 · 2d 구경 · 2d STAFF).
 * icon이 있으면 아이콘 + 제목·설명 줄, 없으면 제목·설명만. note는 가운데 작은 글
 */
const StoreBottomBar = ({ title, desc, note, icon = true }) => (
  <div style={{
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: V('--th-nav-bg'), borderTop: `1px solid ${V('--th-border')}`,
  }}>
    <div style={{
      maxWidth: 430, margin: '0 auto', boxSizing: 'border-box',
      padding: '12px 20px calc(28px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {icon ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CameraIcon />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: V('--th-text') }}>{title}</span>
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{desc}</span>
          </span>
        </div>
      ) : (
        <>
          <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{title}</span>
          <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{desc}</span>
        </>
      )}
      {note && <span style={{ textAlign: 'center', fontSize: '12px', color: V('--th-text-sub') }}>{note}</span>}
    </div>
  </div>
);

export default StoreBottomBar;
