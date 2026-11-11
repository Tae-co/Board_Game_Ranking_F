import { Copy, CheckCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티 초대 코드를 크게 보여 주는 QR 팝업. 바깥을 누르면 닫힌다. */
const InviteQrPopup = ({ inviteCode, codeCopied, onCopy, onClose, t }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: V('--th-card'), borderRadius: '24px',
        padding: '32px 28px', width: '100%', maxWidth: '320px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-text-sub'), margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('community', 'inviteCode')}
      </p>
      <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#fff' }}>
        <QRCodeSVG
          value={`${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${inviteCode}`}
          size={160}
          bgColor="#ffffff"
          fgColor="#1a1a2e"
        />
      </div>
      <div style={{
        fontFamily: 'monospace', fontSize: '32px', fontWeight: '800',
        letterSpacing: '0.2em', color: V('--th-primary'),
      }}>
        {inviteCode}
      </div>
      <button
        onClick={onCopy}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: codeCopied ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          color: codeCopied ? '#22c55e' : '#fff',
          fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', width: '100%',
          justifyContent: 'center',
        }}
      >
        {codeCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
        {t('community', 'copyCode')}
      </button>
    </div>
  </div>
);

export default InviteQrPopup;
