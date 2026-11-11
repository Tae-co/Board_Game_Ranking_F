import { V } from '../../utils/cssUtils';

/** 입력한 초대 코드로 참가할지 한 번 더 묻는 팝업. 바깥을 누르면 취소. */
const JoinConfirmModal = ({ code, onCancel, onConfirm, t }) => (
  <div
    onClick={onCancel}
    style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: V('--th-card'), borderRadius: '20px',
        padding: '28px 24px', width: '100%', maxWidth: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 8px', textAlign: 'center' }}>
        {t('community', 'joinConfirmTitle')}
      </p>
      <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 16px', textAlign: 'center' }}>
        {t('community', 'joinConfirmDesc')}
      </p>
      <div style={{
        backgroundColor: V('--th-bg'), borderRadius: '12px',
        padding: '12px', marginBottom: '24px', textAlign: 'center',
        fontFamily: 'monospace', fontSize: '24px', fontWeight: '800',
        letterSpacing: '0.15em', color: V('--th-primary'),
      }}>
        {code}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '13px', borderRadius: '12px', border: `1px solid var(--th-border)`,
            backgroundColor: V('--th-bg'), color: V('--th-text'),
            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          {t('common', 'cancel')}
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
            color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          {t('community', 'joinConfirmButton')}
        </button>
      </div>
    </div>
  </div>
);

export default JoinConfirmModal;
