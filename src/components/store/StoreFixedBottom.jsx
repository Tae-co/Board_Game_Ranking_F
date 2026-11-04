import { V } from '../../utils/cssUtils';

/** 화면 아래 고정 막대 (시안 3·3b·3d~3n 하단). 안쪽은 세로로 쌓는다 */
const StoreFixedBottom = ({ children }) => (
  <div style={{
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: V('--th-nav-bg'), borderTop: `1px solid ${V('--th-border')}`,
  }}>
    <div style={{
      maxWidth: 430, margin: '0 auto', boxSizing: 'border-box',
      padding: '12px 20px max(12px, calc(env(safe-area-inset-bottom) - 12px))',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {children}
    </div>
  </div>
);

export default StoreFixedBottom;
