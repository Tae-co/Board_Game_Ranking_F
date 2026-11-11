import { Globe, Sun, Moon, ChevronRight } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/** 프로필의 계정 설정 카드 — 테마(라이트/다크) 스위치, 언어(한국어/English) 전환 */
const AccountSettings = ({ themeKey, onToggleTheme, lang, onToggleLang, t }) => {
  const isDark = themeKey === 'ledger';
  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 800, color: V('--th-text'), margin: '0 0 10px 4px' }}>
        {t('profile', 'accountSettings')}
      </p>
      <div style={{ borderRadius: 18, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

        {/* Theme Mode */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid var(--th-border)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            {isDark
              ? <Moon size={18} style={{ color: V('--th-primary') }} />
              : <Sun size={18} style={{ color: V('--th-primary') }} />
            }
            <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{t('profile', 'themeMode')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: V('--th-text-sub') }}>{isDark ? t('profile', 'themeDark') : t('profile', 'themeLight')}</span>
            <button
              onClick={onToggleTheme}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', padding: 3,
                backgroundColor: !isDark ? 'var(--th-primary)' : 'var(--th-border)',
                display: 'flex', alignItems: 'center',
                justifyContent: !isDark ? 'flex-end' : 'flex-start',
                transition: 'background-color 0.25s',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {/* Language */}
        <button
          onClick={onToggleLang}
          style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Globe size={18} style={{ color: V('--th-primary') }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: V('--th-text') }}>{t('profile', 'languageSettings')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: V('--th-text-sub') }}>{lang === 'ko' ? '한국어' : 'English'}</span>
            <ChevronRight size={16} style={{ color: V('--th-text-sub') }} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
