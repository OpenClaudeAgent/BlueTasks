import type {Locale} from 'date-fns';
import {
  de,
  enUS,
  es,
  fr as frLocale,
  it,
  ja,
  nl,
  pl,
  pt,
} from 'date-fns/locale';

/** Match `i18n.language` (e.g. `de`, `de-DE`) to a date-fns locale for react-day-picker. */
export function dayPickerLocaleFor(i18nLanguage: string): Locale {
  const base = i18nLanguage.split('-')[0].toLowerCase();
  switch (base) {
    case 'fr':
      return frLocale;
    case 'de':
      return de;
    case 'es':
      return es;
    case 'it':
      return it;
    case 'nl':
      return nl;
    case 'pl':
      return pl;
    case 'pt':
      return pt;
    case 'ja':
      return ja;
    default:
      return enUS;
  }
}
