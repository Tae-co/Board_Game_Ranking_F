import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import { useTheme } from '../../theme/ThemeContext';

/**
 * 나가기 확인 팝업 (캔버스 UI-CommunityLeave · UI-RoomLeave, 다크 포함).
 * 커뮤니티 나가기와 방 나가기가 같이 쓴다. onConfirm이 실패하면 서버 문구(없으면 failText)를 팝업 안에 보여 준다.
 */
const LeaveConfirmModal = ({ title, desc, items, note, cancelText, confirmText, failText, onClose, onConfirm }) => {
  const { themeKey } = useTheme();
  const dark = themeKey === 'ledger';
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLeaving(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(e?.response?.data?.message || failText);
      setLeaving(false);
    }
  };

  const buttonStyle = {
    flex: 1, height: 48, borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  };

  return (
    <div
      onClick={leaving ? undefined : onClose}
      style={{
        // 방 설정 오버레이(zIndex 100) 위에도 떠야 한다
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px', boxSizing: 'border-box',
          padding: '24px', width: '100%', maxWidth: '342px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 id="leave-confirm-title" style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
            {title}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: dark ? '#CBD5E1' : '#4B5563' }}>{desc}</p>
        </div>
        <ul style={{
          margin: 0, padding: '14px 16px', listStyle: 'none', borderRadius: '12px',
          backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', color: dark ? '#FCA5A5' : '#991B1B',
          display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px',
        }}>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
        {note && <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{note}</p>}
        {error && <p role="alert" style={{ margin: 0, fontSize: '13px', color: '#DC2626' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={leaving}
            style={{
              ...buttonStyle,
              backgroundColor: dark ? V('--th-bg') : '#F3F4F6',
              border: dark ? `1px solid ${V('--th-border')}` : 'none',
              color: dark ? V('--th-text') : '#374151',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={leaving}
            style={{ ...buttonStyle, backgroundColor: '#DC2626', color: '#FFFFFF', opacity: leaving ? 0.6 : 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveConfirmModal;
