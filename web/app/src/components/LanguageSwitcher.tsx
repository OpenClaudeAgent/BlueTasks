type LanguageSwitcherProps = {
  language: string;
  label: string;
  onChange: (language: 'fr' | 'en') => void;
};

export function LanguageSwitcher({language, label, onChange}: LanguageSwitcherProps) {
  return (
    <div className="languageSwitcher" role="group" aria-label={label}>
      {(['fr', 'en'] as const).map((entry) => (
        <button
          key={entry}
          className={language === entry ? 'is-active' : ''}
          onClick={() => onChange(entry)}
          type="button"
        >
          {entry.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
