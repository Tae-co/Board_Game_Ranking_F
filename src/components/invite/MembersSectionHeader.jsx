import { Share2, CheckCheck } from 'lucide-react';
import { V } from '../../utils/cssUtils';

// "멤버" 제목 줄: 내 순위 공유(순위가 있을 때만) · 방 설정 열기
const MembersSectionHeader = ({ title, showShare, shareCopied, onShare, onOpenSettings }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>
      {title}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {showShare && (
        <button
          onClick={onShare}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-text-sub'), display: 'flex', alignItems: 'center' }}
        >
          {shareCopied
            ? <CheckCheck style={{ width: 18, height: 18 }} color="#22c55e" />
            : <Share2 style={{ width: 18, height: 18 }} />}
        </button>
      )}
      <button
        onClick={onOpenSettings}
        style={{
          background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center',
          cursor: 'pointer',
          color: V('--th-text-sub'),
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </button>
    </div>
  </div>
);

export default MembersSectionHeader;
