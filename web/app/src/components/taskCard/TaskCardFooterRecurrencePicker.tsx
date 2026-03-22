import * as Popover from '@radix-ui/react-popover';
import {useState} from 'react';
import {RotateCw} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {todayKey} from '../../lib/dateKeys';
import type {RecurrenceKind, TaskDraftUpdate} from '../../types';
import {RECURRENCE_OPTIONS} from './constants';

export type TaskCardFooterRecurrencePickerProps = {
  taskId: string;
  taskDate: string | null | undefined;
  recurrence: RecurrenceKind | null;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
};

export function TaskCardFooterRecurrencePicker({
  taskId,
  taskDate,
  recurrence,
  onChange,
}: TaskCardFooterRecurrencePickerProps) {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);

  function applyKind(kind: RecurrenceKind | null) {
    if (kind === null) {
      onChange(taskId, {recurrence: null});
    } else {
      onChange(taskId, {
        recurrence: kind,
        taskDate: taskDate ?? todayKey(),
      });
    }
    setOpen(false);
  }

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger asChild>
        <button
          className={`taskCard__iconBtn ${recurrence ? 'is-active' : ''}`}
          title={t('recurrence')}
          type="button"
        >
          <RotateCw size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          aria-label={t('recurrence')}
          className="footerPopover"
          sideOffset={8}
        >
          <div className="footerPopover__title">{t('recurrence')}</div>
          <div className="footerPopover__options">
            {RECURRENCE_OPTIONS.map(({kind, labelKey}) => (
              <button
                key={labelKey}
                className={recurrence === kind ? 'is-selected' : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  applyKind(kind);
                }}
                type="button"
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
