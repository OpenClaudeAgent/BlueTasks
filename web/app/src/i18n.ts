import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en';
import fr from './locales/fr';

const LANG_STORAGE_KEY = 'bluetasks.language';

function readStoredLanguage(): 'fr' | 'en' | undefined {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    if (v === 'fr' || v === 'en') {
      return v;
    }
  } catch {
    /* private mode, etc. */
  }
  return undefined;
}

const browserLanguage = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
const initialLanguage = readStoredLanguage() ?? browserLanguage;

void i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },
  })
  .then(() => {
    document.documentElement.lang = i18n.language;
  });

void i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    if (lng === 'fr' || lng === 'en') {
      localStorage.setItem(LANG_STORAGE_KEY, lng);
    }
  } catch {
    /* ignore */
  }
});

export default i18n;
