import { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useApiErrorMessage } from '../../hooks/useApiErrorMessage';
import ConfirmDialog, { ConfirmDesc, ConfirmNote } from './ConfirmDialog';

/**
 * 나가기 확인 팝업 (캔버스 UI-CommunityLeave · UI-RoomLeave, 다크 포함).
 * 커뮤니티 나가기와 방 나가기가 같이 쓴다. onConfirm이 실패하면 서버 문구(없으면 failText)를 팝업 안에 보여 준다.
 */
const LeaveConfirmModal = ({ title, desc, items, note, cancelText, confirmText, failText, onClose, onConfirm }) => {
  const errorText = useApiErrorMessage();
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
      setError(errorText(e, failText));
      setLeaving(false);
    }
  };

  return (
    <ConfirmDialog
      title={title}
      cancelText={cancelText}
      confirmText={confirmText}
      confirmColor="#DC2626"
      busy={leaving}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <ConfirmDesc>{desc}</ConfirmDesc>
      <ul style={{
        margin: 0, padding: '14px 16px', listStyle: 'none', borderRadius: '12px',
        backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', color: dark ? '#FCA5A5' : '#991B1B',
        display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px',
      }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
      {note && <ConfirmNote>{note}</ConfirmNote>}
      {error && <p role="alert" style={{ margin: 0, fontSize: '13px', color: '#DC2626' }}>{error}</p>}
    </ConfirmDialog>
  );
};

export default LeaveConfirmModal;
