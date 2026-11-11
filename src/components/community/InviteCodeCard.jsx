import { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { V } from '../../utils/cssUtils';
import { EVENTS, logEvent } from '../../api/services/events';

/** 커뮤니티 수정 화면의 초대 코드 + QR 카드. 복사 버튼은 2초 동안 체크 표시로 바뀐다. */
const InviteCodeCard = ({ communityId, inviteCode, t }) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopy = async () => {
    logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'invite_code' } });
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      alert(t('invite', 'shareUnavailable'));
    }
  };

  return (
    <div style={{
      backgroundColor: V('--th-card'), borderRadius: '20px',
      border: `1px solid var(--th-border)`, padding: '20px',
      marginBottom: '20px', textAlign: 'center',
    }}>
      <p style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), margin: '0 0 16px' }}>
        {t('community', 'inviteCode')}
      </p>
      <QRCodeSVG
        value={`${window.location.origin}/join?code=${inviteCode}`}
        size={140}
        bgColor="transparent"
        fgColor="var(--th-text)"
        style={{ display: 'block', margin: '0 auto 16px' }}
      />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        backgroundColor: V('--th-bg'), borderRadius: '12px',
        padding: '12px 16px', border: `1px solid var(--th-border)`,
      }}>
        <span style={{
          fontSize: '22px', fontWeight: '800', letterSpacing: '0.18em',
          color: 'var(--th-primary)', fontFamily: 'monospace',
        }}>
          {inviteCode}
        </span>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          {codeCopied
            ? <CheckCheck size={18} color="#22c55e" />
            : <Copy size={18} color="var(--th-text-sub)" />
          }
        </button>
      </div>
    </div>
  );
};

export default InviteCodeCard;
