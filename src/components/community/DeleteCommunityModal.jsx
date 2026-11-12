import { Trash2 } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 커뮤니티 삭제 확인 (아래에서 올라오는 시트). 바깥을 누르면 닫힌다. */
const DeleteCommunityModal = ({ communityName, isDeleting, onClose, onConfirm, t }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    padding: '0 0 0 0',
  }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div style={{
      width: '100%', maxWidth: '390px',
      backgroundColor: V('--th-card'),
      borderRadius: '24px 24px 0 0',
      padding: '28px 24px 40px',
    }}>
      {/* 빨간 아이콘 */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        backgroundColor: 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
      }}>
        <Trash2 size={24} color="#ef4444" />
      </div>

      <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), textAlign: 'center', margin: '0 0 10px' }}>
        {t('community', 'deleteConfirmTitle')}
      </p>
      <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
        {t('community', 'deleteConfirmDesc')}
      </p>

      {/* 커뮤니티 이름 표시 */}
      <div style={{
        backgroundColor: V('--th-bg'), borderRadius: '12px',
        padding: '12px 16px', textAlign: 'center', marginBottom: '24px',
        border: `1px solid var(--th-border)`,
      }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text') }}>
          {communityName}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: '14px',
            borderRadius: '12px', border: `1px solid var(--th-border)`,
            backgroundColor: V('--th-bg'), color: V('--th-text'),
            fontSize: '15px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          {t('common', 'cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          style={{
            flex: 1, padding: '14px',
            borderRadius: '12px', border: 'none',
            backgroundColor: '#ef4444', color: '#fff',
            fontSize: '15px', fontWeight: '700',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            opacity: isDeleting ? 0.7 : 1,
          }}
        >
          {isDeleting ? t('community', 'deleting') : t('community', 'deleteConfirmButton')}
        </button>
      </div>
    </div>
  </div>
);

export default DeleteCommunityModal;
