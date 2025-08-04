import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import viTranslation from './locales/vi/translation.json';
import enAuth from './locales/en/auth.json';
import viAuth from './locales/vi/auth.json';

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: enTranslation,
        auth: enAuth,
      },
      vi: {
        translation: viTranslation,
        auth: viAuth,
      },
    },
  });

export default i18n;
