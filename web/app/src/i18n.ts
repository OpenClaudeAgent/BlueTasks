import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import de from './locales/de';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import it from './locales/it';
import ja from './locales/ja';
import nl from './locales/nl';
import pl from './locales/pl';
import pt from './locales/pt';
import {isUiLanguageCode, type UiLanguageCode} from './locales/uiLanguages';

const LANG_STORAGE_KEY = 'bluetasks.language';

function readStoredLanguage(): UiLanguageCode | undefined {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    if (v && isUiLanguageCode(v)) {
      return v;
    }
  } catch {
    /* private mode, etc. */
  }
  return undefined;
}

/** No stored preference → English (do not infer UI language from the browser locale). */
const initialLanguage = readStoredLanguage() ?? 'en';

void i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {translation: en},
      fr: {translation: fr},
      de: {translation: de},
      es: {translation: es},
      it: {translation: it},
      nl: {translation: nl},
      pl: {translation: pl},
      pt: {translation: pt},
      ja: {translation: ja},
    },
  })
  .then(() => {
    document.documentElement.lang = i18n.language;
  });

void i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    const base = lng.split('-')[0].toLowerCase();
    if (isUiLanguageCode(base)) {
      localStorage.setItem(LANG_STORAGE_KEY, base);
    }
  } catch {
    /* ignore */
  }
});

export default i18n;
