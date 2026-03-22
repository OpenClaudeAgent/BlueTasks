/** Supported UI languages (i18n + date-fns DayPicker + Intl). */
export const UI_LANGUAGE_OPTIONS = [
  {code: 'en', label: 'English'},
  {code: 'fr', label: 'Français'},
  {code: 'de', label: 'Deutsch'},
  {code: 'es', label: 'Español'},
  {code: 'it', label: 'Italiano'},
  {code: 'nl', label: 'Nederlands'},
  {code: 'pl', label: 'Polski'},
  {code: 'pt', label: 'Português'},
  {code: 'ja', label: '日本語'},
] as const;

export type UiLanguageCode = (typeof UI_LANGUAGE_OPTIONS)[number]['code'];

export function isUiLanguageCode(value: string): value is UiLanguageCode {
  return UI_LANGUAGE_OPTIONS.some((o) => o.code === value);
}

export function normalizeUiLanguageCode(i18nLng: string): UiLanguageCode {
  const base = i18nLng.split('-')[0].toLowerCase();
  return isUiLanguageCode(base) ? base : 'en';
}
