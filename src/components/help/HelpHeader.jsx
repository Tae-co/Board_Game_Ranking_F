import { ArrowLeft } from 'lucide-react';
import NavAvatar from '../NavAvatar';
import { V } from '../../utils/cssUtils';

/** 사용방법 화면 머리: 뒤로 · 사용방법 · 내 아바타 */
const HelpHeader = ({ onBack, title }) => (
  <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
    <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} aria-label="back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color="var(--th-primary)" />
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: V('--th-text'), margin: 0 }}>{title}</h1>
      </div>
      <NavAvatar size={36} fontSize={14} />
    </div>
  </div>
);

export default HelpHeader;
