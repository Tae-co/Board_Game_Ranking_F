import { V } from '../../utils/cssUtils';

/**
 * 매장 홈 아래 고정 안내 (시안 2 체크인 만료 · 2d 구경 · 2d STAFF). 제목 한 줄 + 있으면 설명. 제목만 있으면(QR 안내) 가운데 정렬.
 * 아이콘은 두지 않는다 — 카메라 아이콘이 있으면 누르면 카메라가 열리는 버튼으로 착각한다 (앱 안 스캐너 없음)
 */
const StoreBottomBar = ({ title, desc }) => (
  <div style={{
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: V('--th-nav-bg'), borderTop: `1px solid ${V('--th-border')}`,
  }}>
    <div style={{
      maxWidth: 430, margin: '0 auto', boxSizing: 'border-box',
      padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), textAlign: desc ? 'left' : 'center' }}>{title}</span>
      {desc && <span style={{ fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{desc}</span>}
    </div>
  </div>
);

export default StoreBottomBar;
