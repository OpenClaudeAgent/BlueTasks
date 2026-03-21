import {AREA_ICON_IDS, type AreaIconId, getAreaIconComponent} from '../lib/areaIcons';

type AreaIconPickerProps = {
  value: AreaIconId;
  onChange: (id: AreaIconId) => void;
  disabled?: boolean;
  labelledBy?: string;
};

export function AreaIconPicker({value, onChange, disabled, labelledBy}: AreaIconPickerProps) {
  return (
    <div
      aria-labelledby={labelledBy}
      className="areaIconPicker"
      role="group"
    >
      {AREA_ICON_IDS.map((id) => {
        const Icon = getAreaIconComponent(id);
        const selected = value === id;
        return (
          <button
            aria-label={id}
            aria-pressed={selected}
            className={`areaIconPicker__btn ${selected ? 'is-selected' : ''}`}
            disabled={disabled}
            key={id}
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
