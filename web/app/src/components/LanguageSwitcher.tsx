import {UI_LANGUAGE_OPTIONS, type UiLanguageCode} from '../locales/uiLanguages';

type LanguageSwitcherProps = {
  language: UiLanguageCode;
  label: string;
  onChange: (language: UiLanguageCode) => void;
};

export function LanguageSwitcher({language, label, onChange}: LanguageSwitcherProps) {
  return (
    <div className="languageSwitcher" role="group" aria-label={label}>
      {UI_LANGUAGE_OPTIONS.map(({code, label: langLabel}) => (
        <button
          key={code}
          className={language === code ? 'is-active' : ''}
          onClick={() => onChange(code)}
          type="button"
        >
          {langLabel}
        </button>
      ))}
    </div>
  );
}
