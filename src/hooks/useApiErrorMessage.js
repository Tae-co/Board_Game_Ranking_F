import { useLanguage } from '../i18n/LanguageContext';
import translations from '../i18n/translations/index';

/**
 * 서버 오류 응답({ message, code })을 화면 언어 문구로 바꾸는 함수를 돌려준다.
 * - 한국어: 서버 문구 그대로 (값이 들어간 문구 포함, 전과 같음). 없으면 fallback
 * - 그 밖의 언어: code의 번역 → 없으면 fallback. 서버의 한국어 문구는 띄우지 않는다
 *   (t()는 없는 키를 한국어로 채우므로 번역표를 직접 본다)
 */
export const useApiErrorMessage = () => {
  const { lang } = useLanguage();
  return (err, fallback) => {
    const data = err?.response?.data;
    if (lang === 'ko') {
      return typeof data?.message === 'string' && data.message.trim() ? data.message : fallback;
    }
    return translations[lang]?.errors?.[data?.code] ?? fallback;
  };
};
