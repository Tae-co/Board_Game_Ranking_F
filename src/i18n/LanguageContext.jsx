import { createContext, useContext, useState } from 'react';
import translations from './translations/index';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // 고른 적 없으면 기기 언어를 따른다 — 한국어 기기에서 첫 화면이 영어로 떠서 영어 앱인 줄 알았다
  const [lang, setLangState] = useState(
    () => localStorage.getItem('language')
      || (navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en')
  );

  const setLang = (newLang) => {
    localStorage.setItem('language', newLang);
    setLangState(newLang);
  };

  const t = (section, key) => {
    return translations[lang]?.[section]?.[key] ?? translations['ko']?.[section]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
