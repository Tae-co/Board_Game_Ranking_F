import { CheckCheck, Copy, Share2 } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티를 만든 직후 친구 부르기 카드 — 누르면 복사되는 초대 코드, 공유 버튼 */
// label·shareDisabled는 연습용: 위에 「초대 코드 (연습용)」, 링크 보내기는 눌리지 않게
const InviteShareCard = ({ inviteCode, codeCopied, linkCopied, onCopyCode, onShare, label, shareDisabled = false, t }) => (
  <div style={{
    backgroundColor: V('--th-card'), borderRadius: '20px',
    border: `1px solid var(--th-border)`, padding: '24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    marginBottom: '16px',
  }}>
    {label && (
      <p style={{ fontSize: '12px', fontWeight: '700', color: V('--th-text-sub'), margin: 0, letterSpacing: '0.08em' }}>
        {label}
      </p>
    )}
    <button
      onClick={onCopyCode}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '800', letterSpacing: '0.2em', color: V('--th-primary') }}>
        {inviteCode}
      </span>
      {codeCopied
        ? <CheckCheck size={18} color="#22c55e" />
        : <Copy size={18} color="var(--th-text-sub)" />
      }
    </button>
    <button
      onClick={onShare}
      disabled={shareDisabled}
      style={{
        opacity: shareDisabled ? 0.5 : 1,
        width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: shareDisabled ? 'not-allowed' : 'pointer',
        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
        color: '#fff', fontSize: '16px', fontWeight: '700',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      {linkCopied ? <CheckCheck size={18} /> : <Share2 size={18} />}
      {linkCopied ? t('community', 'onboardLinkCopied') : t('community', 'onboardShare')}
    </button>
  </div>
);

export default InviteShareCard;
