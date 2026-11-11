import { V } from '../../utils/cssUtils';

/** 방금 만든 커뮤니티를 없던 일로 할지 묻는 창 — 이미 들어온 친구가 있으면 그 사람들도 빠진다는 걸 알려준다 */
const CancelCreationModal = ({ hasFriends, error, isCanceling, onKeep, onConfirm, t }) => (
  <div
    onClick={() => !isCanceling && onKeep()}
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
        {t('community', 'onboardCancelTitle')}
      </p>
      <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
        {t('community', hasFriends ? 'onboardCancelDescWithFriends' : 'onboardCancelDesc')}
      </p>
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', margin: '-12px 0 12px', textAlign: 'center' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onKeep}
          disabled={isCanceling}
          style={{
            flex: 1, padding: '13px', borderRadius: '12px', border: `1px solid var(--th-border)`,
            backgroundColor: V('--th-bg'), color: V('--th-text'),
            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          {t('community', 'onboardCancelKeep')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isCanceling}
          style={{
            flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
            backgroundColor: '#ef4444', color: '#fff',
            fontSize: '15px', fontWeight: '700', cursor: isCanceling ? 'not-allowed' : 'pointer',
            opacity: isCanceling ? 0.7 : 1,
          }}
        >
          {isCanceling ? t('community', 'deleting') : t('community', 'onboardCancelConfirm')}
        </button>
      </div>
    </div>
  </div>
);

export default CancelCreationModal;
