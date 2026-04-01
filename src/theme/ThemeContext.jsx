import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  default: {
    label: '라이트',
    labelEn: 'Light',
    preview: '#266EFF',
    vars: {
      '--th-primary':       '#266EFF',
      '--th-primary-dark':  '#1A55D4',
      '--th-primary-light': '#5A93FF',
      '--th-primary-rgb':   '38, 110, 255',
      '--th-bg':            '#F5F5FF',
      '--th-bg-deep':       '#EAECFF',
      '--th-card':          '#FFFFFF',
      '--th-border':        '#DCDEFF',
      '--th-text':          '#0F172A',
      '--th-text-sub':      '#64748B',
      '--th-dot':           'transparent',
      '--th-btn-ghost-bg':  '#FFFFFF',
      '--th-btn-ghost-border': '#DCDEFF',
      '--th-btn-ghost-text':   '#64748B',
    },
  },
  ledger: {
    label: '다크',
    labelEn: 'Dark',
    preview: '#D4AF37',
    vars: {
      '--th-primary':       '#D4AF37',
      '--th-primary-dark':  '#B8921E',
      '--th-primary-light': '#F0CA5E',
      '--th-primary-rgb':   '212, 175, 55',
      '--th-bg':            '#0A192F',
      '--th-bg-deep':       '#070F1E',
      '--th-card':          '#112240',
      '--th-border':        '#1E3A5F',
      '--th-text':          '#E8F0FE',
      '--th-text-sub':      '#8BA3C4',
      '--th-dot':           'rgba(30, 58, 95, 0.6)',
      '--th-btn-ghost-bg':  '#1B3A5D',
      '--th-btn-ghost-border': '#2A5080',
      '--th-btn-ghost-text':   '#8BA3C4',
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
