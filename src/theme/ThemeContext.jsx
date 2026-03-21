import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  default: {
    label: '기본',
    labelEn: 'Default',
    preview: '#D4853A',
    vars: {
      '--th-primary':      '#D4853A',
      '--th-primary-dark': '#B86F2E',
      '--th-primary-light':'#E89A4F',
      '--th-primary-rgb':  '212, 133, 58',
      '--th-bg':           '#FFF8F0',
      '--th-card':         '#FFFFFF',
      '--th-border':       '#E5D5C0',
      '--th-text':         '#2C1F0E',
      '--th-text-sub':     '#8B7355',
      '--th-btn-ghost-bg': '#FFFFFF',
      '--th-btn-ghost-border': '#E5D5C0',
      '--th-btn-ghost-text':   '#8B7355',
    },
  },
  black: {
    label: '블랙',
    labelEn: 'Black',
    preview: '#1E293B',
    vars: {
      '--th-primary':      '#60A5FA',
      '--th-primary-dark': '#3B82F6',
      '--th-primary-light':'#93C5FD',
      '--th-primary-rgb':  '96, 165, 250',
      '--th-bg':           '#0F172A',
      '--th-card':         '#1E293B',
      '--th-border':       '#334155',
      '--th-text':         '#F1F5F9',
      '--th-text-sub':     '#94A3B8',
      '--th-btn-ghost-bg': '#2D3F55',
      '--th-btn-ghost-border': '#60A5FA',
      '--th-btn-ghost-text':   '#E2E8F0',
    },
  },
  purple: {
    label: '퍼플',
    labelEn: 'Purple',
    preview: '#C026D3',
    vars: {
      '--th-primary':      '#C026D3',
      '--th-primary-dark': '#A21CAF',
      '--th-primary-light':'#E879F9',
      '--th-primary-rgb':  '192, 38, 211',
      '--th-bg':           '#FDF4FF',
      '--th-card':         '#FFFFFF',
      '--th-border':       '#E9D5FF',
      '--th-text':         '#3B0764',
      '--th-text-sub':     '#7E22CE',
      '--th-btn-ghost-bg': '#FFFFFF',
      '--th-btn-ghost-border': '#D8B4FE',
      '--th-btn-ghost-text':   '#7E22CE',
    },
  },
  blue: {
    label: '블루',
    labelEn: 'Blue',
    preview: '#2563EB',
    vars: {
      '--th-primary':      '#2563EB',
      '--th-primary-dark': '#1D4ED8',
      '--th-primary-light':'#60A5FA',
      '--th-primary-rgb':  '37, 99, 235',
      '--th-bg':           '#EFF6FF',
      '--th-card':         '#FFFFFF',
      '--th-border':       '#BFDBFE',
      '--th-text':         '#1E3A5F',
      '--th-text-sub':     '#3B82F6',
      '--th-btn-ghost-bg': '#FFFFFF',
      '--th-btn-ghost-border': '#93C5FD',
      '--th-btn-ghost-text':   '#1D4ED8',
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
    () => localStorage.getItem('theme') || 'default'
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
