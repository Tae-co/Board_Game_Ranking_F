import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  default: {
    label: '라이트',
    labelEn: 'Light',
    preview: '#4F46E5',
    vars: {
      '--th-primary':          '#4F46E5',
      '--th-primary-dark':     '#3730A3',
      '--th-primary-light':    '#818CF8',
      '--th-primary-rgb':      '79, 70, 229',
      '--th-bg':               '#F8F8FD',
      '--th-bg-deep':          '#EEEEF8',
      '--th-nav-bg':           '#FFFFFF',
      '--th-card':             '#FFFFFF',
      '--th-border':           '#E5E7EB',
      '--th-text':             '#111827',
      '--th-text-sub':         '#6B7280',
      '--th-dot':              'transparent',
      '--th-btn-ghost-bg':     '#FFFFFF',
      '--th-btn-ghost-border': '#E5E7EB',
      '--th-btn-ghost-text':   '#6B7280',
    },
  },
  ledger: {
    label: '다크',
    labelEn: 'Dark',
    preview: '#6366F1',
    vars: {
      '--th-primary':          '#6366F1',
      '--th-primary-dark':     '#4F46E5',
      '--th-primary-light':    '#818CF8',
      '--th-primary-rgb':      '99, 102, 241',
      '--th-bg':               '#0F0F1A',
      '--th-bg-deep':          '#070710',
      '--th-nav-bg':           '#1A1A2E',
      '--th-card':             '#1A1A2E',
      '--th-border':           '#2D2D4A',
      '--th-text':             '#F1F5F9',
      '--th-text-sub':         '#94A3B8',
      '--th-dot':              'rgba(99,102,241,0.08)',
      '--th-btn-ghost-bg':     '#1A1A2E',
      '--th-btn-ghost-border': '#2D2D4A',
      '--th-btn-ghost-text':   '#94A3B8',
    },
  },
};

function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.default;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  document.body.style.backgroundColor = theme.vars['--th-bg'];
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState(
    () => localStorage.getItem('theme') || 'ledger'
  );

  useEffect(() => {
    applyTheme(themeKey);
  }, [themeKey]);

  const setTheme = (key) => {
    localStorage.setItem('theme', key);
    setThemeKeyState(key);
    applyTheme(key);
  };

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
