import { createContext, useContext, useState } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('language') || 'en'
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
