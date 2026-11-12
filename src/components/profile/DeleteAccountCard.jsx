import { V } from '../../utils/cssUtils';

/** 프로필 맨 아래 회원 탈퇴 카드 */
const DeleteAccountCard = ({ isDeleting, onDelete, t }) => (
  <div style={{ borderRadius: 18, padding: '16px 18px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>{t('profile', 'deleteAccount')}</div>
    <p style={{ fontSize: 12, color: V('--th-text-sub'), margin: '0 0 12px' }}>
      {t('profile', 'deleteAccountDesc')}
    </p>
    <button
      onClick={onDelete}
      disabled={isDeleting}
      style={{
        width: '100%', padding: '11px 0', borderRadius: 50, fontSize: 13, fontWeight: 700,
        backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626',
        opacity: isDeleting ? 0.6 : 1, cursor: isDeleting ? 'not-allowed' : 'pointer',
      }}
    >
      {isDeleting ? t('profile', 'deleteAccountProcessing') : t('profile', 'deleteAccount')}
    </button>
  </div>
);

export default DeleteAccountCard;
