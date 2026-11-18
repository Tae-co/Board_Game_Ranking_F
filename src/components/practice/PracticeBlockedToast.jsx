import { Lock } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';

/**
 * 연습 중 가이드 밖 버튼을 누르면 아래에 2초 뜨는 토스트 (캔버스 Sim-S15-Blocked, 다크 포함).
 * 보라색 안내 말풍선과 헷갈리지 않게 무채색: 라이트는 어두운 토스트, 다크는 밝은 토스트.
 */
const PracticeBlockedToast = () => {
  const { t } = useLanguage();
  const { themeKey } = useTheme();
  const dark = themeKey === 'ledger';
  const fg = dark ? '#111827' : '#FFFFFF';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: 16, right: 16, zIndex: 300,
        bottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        maxWidth: 358, margin: '0 auto', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 16,
        background: dark ? '#F1F5F9' : '#1F2937', color: fg,
        boxShadow: '0 8px 24px rgba(17,24,39,0.28)',
        // 아래 버튼(매치 수정·삭제 등)을 가리는 동안 누른 게 토스트에 먹히지 않게
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: dark ? '#E2E8F0' : '#374151',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={16} color={fg} aria-hidden="true" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800 }}>{t('practice', 'blockedTitle')}</p>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: dark ? '#475569' : '#D1D5DB' }}>{t('practice', 'blockedDesc')}</p>
      </div>
    </div>
  );
};

export default PracticeBlockedToast;
