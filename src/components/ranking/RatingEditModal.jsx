import { V } from '../../utils/cssUtils';

const RatingEditModal = ({ ratingEditModal, onClose, ratingEditValue, setRatingEditValue, onSave, isSaving, t }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
    <div style={{ borderRadius: 16, padding: 24, margin: '0 16px', width: '100%', maxWidth: 320, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: V('--th-text'), marginBottom: 4 }}>{t('ranking', 'editRating')}</h3>
      <p style={{ fontSize: 13, color: V('--th-primary'), marginBottom: 4 }}>{ratingEditModal.nickname}</p>
      <p style={{ fontSize: 12, color: V('--th-text-sub'), marginBottom: 16 }}>{t('ranking', 'editRatingDesc')}</p>
      <input
        type="number"
        value={ratingEditValue}
        onChange={(e) => setRatingEditValue(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 10, textAlign: 'center',
          fontSize: 18, fontWeight: 700, outline: 'none', marginBottom: 16,
          backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`, color: V('--th-text'),
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}>
          {t('common', 'cancel')}
        </button>
        <button onClick={onSave} disabled={isSaving} style={{ flex: 1, padding: 10, borderRadius: 24, fontSize: 13, fontWeight: 700, backgroundColor: V('--th-primary'), color: '#fff', border: 'none', cursor: 'pointer', opacity: isSaving ? 0.5 : 1 }}>
          {isSaving ? t('ranking', 'saving') : t('ranking', 'save')}
        </button>
      </div>
    </div>
  </div>
);

export default RatingEditModal;
