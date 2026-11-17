import { V } from '../../utils/cssUtils';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * 연습 중 헤더 뒤로 가기를 누르면 뜨는 종료 확인 (캔버스 Sim-S14-ExitConfirm, 다크 포함).
 * 모양은 LeaveConfirmModal과 같고, 지워지는 게 연습뿐이라 빨간 목록·버튼 대신 기본 색.
 */
const PracticeExitModal = ({ onClose, onConfirm }) => {
  const { t } = useLanguage();
  const { themeKey } = useTheme();
  const dark = themeKey === 'ledger';

  const buttonStyle = {
    flex: 1, height: 48, borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-exit-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: V('--th-card'), borderRadius: '20px', boxSizing: 'border-box',
          padding: '24px', width: '100%', maxWidth: '342px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 id="practice-exit-title" style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: V('--th-text') }}>
            {t('practice', 'exitTitle')}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: dark ? '#CBD5E1' : '#4B5563' }}>{t('practice', 'exitDesc')}</p>
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('practice', 'exitNote')}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              backgroundColor: dark ? V('--th-bg') : '#F3F4F6',
              border: dark ? `1px solid ${V('--th-border')}` : 'none',
              color: dark ? V('--th-text') : '#374151',
            }}
          >
            {t('practice', 'exitContinue')}
          </button>
          <button onClick={onConfirm} style={{ ...buttonStyle, backgroundColor: V('--th-primary'), color: '#FFFFFF' }}>
            {t('practice', 'exitConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeExitModal;
