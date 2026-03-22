import * as Popover from '@radix-ui/react-popover';
import {useMemo, useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {Area, TaskDraftUpdate} from '../../types';
import {areaNameByIdMap} from './taskCardModel';

export type TaskCardFooterAreaPickerProps = {
  taskId: string;
  areaId: string | null | undefined;
  areas: Area[];
  /** Resolved in the parent so the icon component is not created inside this child render. */
  areaGlyph: LucideIcon;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterAreaPicker({
  taskId,
  areaId,
  areas,
  areaGlyph: AreaGlyph,
  onChange,
}: TaskCardFooterAreaPickerProps) {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);

  const areaNameById = useMemo(() => areaNameByIdMap(areas), [areas]);
  const areaDisplayName = areaId ? (areaNameById[areaId] ?? null) : null;

  const footerLabel = areaId ? (areaDisplayName ?? t('areaMissing')) : t('areaNone');

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button className="taskCard__footerAreaTrigger" title={t('areaLabel')} type="button">
          <AreaGlyph aria-hidden size={14} strokeWidth={2} />
          <span className="taskCard__footerAreaTriggerText">{footerLabel}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" className="footerPopover" sideOffset={8}>
          <div className="footerPopover__title">{t('areaLabel')}</div>
          <div className="footerPopover__options">
            <button
              className={!areaId ? 'is-selected' : undefined}
              onClick={() => {
                onChange(taskId, {areaId: null});
                setOpen(false);
              }}
              type="button"
            >
              {t('areaNone')}
            </button>
            {areas.map((a) => (
              <button
                key={a.id}
                className={areaId === a.id ? 'is-selected' : undefined}
                onClick={() => {
                  onChange(taskId, {areaId: a.id});
                  setOpen(false);
                }}
                type="button"
              >
                {a.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
