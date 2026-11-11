/** 점수판 아래 고정 저장 버튼 */
const SubmitBar = ({ onSubmit, isSubmitting, isEdit, t }) => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, var(--th-bg) 70%, transparent)' }}>
    <div style={{ maxWidth: 375, margin: '0 auto', padding: '20px 16px calc(32px + env(safe-area-inset-bottom))' }}>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 50, border: 'none',
          background: isSubmitting ? 'var(--th-border)' : 'var(--th-primary)',
          color: '#fff', fontSize: 14, fontWeight: 900, cursor: isSubmitting ? 'not-allowed' : 'pointer',
          boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(107, 92, 231, 0.4)',
        }}
      >
        {isSubmitting ? t('scoreSheet', 'saving') : isEdit ? t('scoreSheet', 'submitEdit') : t('scoreSheet', 'submit')}
      </button>
    </div>
  </div>
);

export default SubmitBar;
