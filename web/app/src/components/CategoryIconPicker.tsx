import {CATEGORY_ICON_IDS, type CategoryIconId, getCategoryIconComponent} from '../lib/categoryIcons';

type CategoryIconPickerProps = {
  value: CategoryIconId;
  onChange: (next: CategoryIconId) => void;
  disabled?: boolean;
  labelledBy: string;
};

export function CategoryIconPicker({value, onChange, disabled, labelledBy}: CategoryIconPickerProps) {
  return (
    <div aria-labelledby={labelledBy} className="categoryIconPicker" role="group">
      {CATEGORY_ICON_IDS.map((id) => {
        const Icon = getCategoryIconComponent(id);
        const selected = id === value;
        return (
          <button
            key={id}
            aria-pressed={selected}
            className={`categoryIconPicker__btn ${selected ? 'is-selected' : ''}`}
            disabled={disabled}
            onClick={() => onChange(id)}
            title={id}
            type="button"
          >
            <Icon aria-hidden size={16} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
