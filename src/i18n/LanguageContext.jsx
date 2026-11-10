import { createContext, useContext, useState } from 'react';
import translations from './translations/index';
import { getLanguage, saveLanguage } from '../utils/storage';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLanguage);

  const setLang = (newLang) => {
    saveLanguage(newLang);
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
