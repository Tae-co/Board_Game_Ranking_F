import { useId } from 'react';
import { V } from '../../utils/cssUtils';
import { useTheme } from '../../theme/ThemeContext';

/**
 * 가운데 확인 팝업 틀: 어두운 배경 + 카드(제목, 본문, 취소·확인 두 버튼).
 * 나가기 확인(LeaveConfirmModal)과 연습 종료 확인(PracticeExitModal)이 같이 쓴다. 본문은 children.
 * busy인 동안은 배경·버튼을 눌러도 닫히지 않는다.
 */
const ConfirmDialog = ({ title, children, cancelText, confirmText, confirmColor, busy = false, onClose, onConfirm }) => {
  const { themeKey } = useTheme();
  const dark = themeKey === 'ledger';
  const titleId = useId();

  const buttonStyle = {
    flex: 1, height: 48, borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  };

  return (
    <div
      onClick={busy ? undefined : onClose}
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
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px', boxSizing: 'border-box',
          padding: '24px', width: '100%', maxWidth: '342px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <h2 id={titleId} style={{ margin: '0 0 -8px', fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
          {title}
        </h2>
        {children}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={busy}
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
            onClick={onConfirm}
            disabled={busy}
            style={{ ...buttonStyle, backgroundColor: confirmColor, color: '#FFFFFF', opacity: busy ? 0.6 : 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/** 제목 바로 아래 설명 한 줄 (제목과 8px) */
export const ConfirmDesc = ({ children }) => {
  const { themeKey } = useTheme();
  return (
    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: themeKey === 'ledger' ? '#CBD5E1' : '#4B5563' }}>
      {children}
    </p>
  );
};

/** 회색 작은 안내 */
export const ConfirmNote = ({ children }) => (
  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{children}</p>
);

export default ConfirmDialog;
