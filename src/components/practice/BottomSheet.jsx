import { useEffect } from 'react';
import { V } from '../../utils/cssUtils';

/** 연습 시작·끝 안내 시트. 어두운 배경 위 아래에서 올라온다. */
const BottomSheet = ({ label, onClose, children, align = 'stretch' }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        role="dialog"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 390, boxSizing: 'border-box',
          backgroundColor: V('--th-card'), color: V('--th-text'),
          borderRadius: '24px 24px 0 0',
          padding: '26px 24px calc(28px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', alignItems: align, gap: 14,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
