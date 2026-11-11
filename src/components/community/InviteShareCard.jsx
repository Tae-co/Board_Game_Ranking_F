import { QRCodeSVG } from 'qrcode.react';
import { CheckCheck, Copy, Share2 } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티를 만든 직후 친구 부르기 카드 — QR, 누르면 복사되는 초대 코드, 공유 버튼 */
const InviteShareCard = ({ joinUrl, inviteCode, codeCopied, linkCopied, onCopyCode, onShare, t }) => (
  <div style={{
    backgroundColor: V('--th-card'), borderRadius: '20px',
    border: `1px solid var(--th-border)`, padding: '24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    marginBottom: '16px',
  }}>
    <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#fff' }}>
      <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#1a1a2e" />
    </div>
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
      style={{
        width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
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
