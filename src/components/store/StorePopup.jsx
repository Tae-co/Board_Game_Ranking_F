import { V } from '../../utils/cssUtils';
import { InfoIcon } from './StoreIcons';

/** 위쪽 막대 오른쪽 ! 버튼 (규칙 설명은 화면 대신 팝업으로, plan-store §2) */
export const InfoButton = ({ onClick, label }) => (
  <button onClick={onClick} aria-label={label} style={{
    width: 44, height: 44, padding: 0, border: 'none', borderRadius: 999, background: 'none', cursor: 'pointer',
    color: V('--th-text-sub'), display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <InfoIcon />
  </button>
);

/** 알아 두세요 (시안 2b·3b): 위쪽에 뜨는 반투명 카드 */
export const InfoPopup = ({ title, text, okLabel, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 220 }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
    <div role="dialog" aria-modal="true" style={{
      position: 'absolute', top: 160, left: 24, right: 24, maxWidth: 382, margin: '0 auto',
      backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '20px',
      boxShadow: '0 16px 40px rgba(17,24,39,0.18)', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{title}</h2>
      <span style={{ fontSize: '14px', lineHeight: 1.7, color: V('--th-text-sub'), whiteSpace: 'pre-line' }}>{text}</span>
      <button onClick={onClose} style={{
        height: 48, border: 'none', borderRadius: '14px', cursor: 'pointer',
        backgroundColor: V('--th-primary'), color: '#fff', fontSize: '15px', fontWeight: 700,
      }}>{okLabel}</button>
    </div>
  </div>
);

/** 가운데 확인창 (시안 2i·3d·3k). danger면 빨간 버튼 */
export const ConfirmDialog = ({ title, body, note, cancelLabel, actionLabel, onCancel, onAction, danger = true, busy = false }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 230, backgroundColor: 'rgba(17,24,39,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box',
  }}>
    <div role="dialog" aria-modal="true" style={{
      width: '100%', maxWidth: 382, backgroundColor: V('--th-card'), borderRadius: '20px', padding: '24px',
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>{title}</h2>
        {body && <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: V('--th-text-sub') }}>{body}</p>}
      </div>
      {note && <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{note}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{
          flex: 1, height: 48, border: 'none', borderRadius: '12px', cursor: 'pointer',
          backgroundColor: V('--th-bg-deep'), color: V('--th-text'), fontSize: '15px', fontWeight: 700,
        }}>{cancelLabel}</button>
        <button onClick={onAction} disabled={busy} style={{
          flex: 1, height: 48, border: 'none', borderRadius: '12px', cursor: busy ? 'default' : 'pointer',
          backgroundColor: danger ? '#DC2626' : V('--th-primary'), color: '#fff', fontSize: '15px', fontWeight: 700,
          opacity: busy ? 0.6 : 1,
        }}>{actionLabel}</button>
      </div>
    </div>
  </div>
);
