import { ArrowLeft } from 'lucide-react';
import NavAvatar from '../NavAvatar';
import { V } from '../../utils/cssUtils';

// 게임방 로비 상단 바: 뒤로(로비) · 제목 · 내 아바타
const InviteHeader = ({ onBack, title }) => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 10,
    backgroundColor: V('--th-nav-bg'),
    borderBottom: `1px solid var(--th-border)`,
  }}>
    <div style={{
      maxWidth: 390, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px',
    }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
      >
        <ArrowLeft style={{ width: 24, height: 24 }} />
      </button>
      <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>
        {title}
      </h1>
      <NavAvatar />
    </div>
  </div>
);

export default InviteHeader;
