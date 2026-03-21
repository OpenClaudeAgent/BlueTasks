import * as Popover from '@radix-ui/react-popover';
import {DayPicker} from 'react-day-picker';
import type {Locale} from 'date-fns';
import {RotateCw} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {addDaysToKey, formatDateKey, parseTaskDate, todayKey} from '../../lib/date';
import type {RecurrenceKind} from '../../types';

export type TaskCardHeaderDatePopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDate: string | null;
  recurrence: RecurrenceKind | null;
  dateTone: string;
  datePillLabel: string | null;
  dayPickerLocale: Locale;
  onSelectDate: (dateKey: string | null) => void;
};

export function TaskCardHeaderDatePopover({
  open,
  onOpenChange,
  taskDate,
  recurrence,
  dateTone,
  datePillLabel,
  dayPickerLocale,
  onSelectDate,
}: TaskCardHeaderDatePopoverProps) {
  const {t} = useTranslation();

  return (
    <Popover.Root onOpenChange={onOpenChange} open={open}>
      <Popover.Trigger asChild>
        <button
          className={`taskCard__datePill ${taskDate ? `taskCard__datePill--${dateTone}` : 'taskCard__datePill--empty'} ${recurrence ? 'taskCard__datePill--recurring' : ''}`}
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <span className="taskCard__datePillInner">
            {datePillLabel ?? t('noDateShort')}
            {recurrence ? <RotateCw aria-hidden className="taskCard__datePillRepeat" size={11} strokeWidth={2.5} /> : null}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" className="datePopover" sideOffset={8}>
          <div className="datePopover__quickActions">
            <button onClick={() => onSelectDate(todayKey())} type="button">
              {t('today')}
            </button>
            <button onClick={() => onSelectDate(addDaysToKey(todayKey(), 1))} type="button">
              {t('tomorrow')}
            </button>
            <button onClick={() => onSelectDate(addDaysToKey(todayKey(), 7))} type="button">
              {t('nextWeek')}
            </button>
            <button onClick={() => onSelectDate(null)} type="button">
              {t('clearDate')}
            </button>
          </div>

          <DayPicker
            locale={dayPickerLocale}
            mode="single"
            onSelect={(date) => onSelectDate(date ? formatDateKey(date) : null)}
            selected={taskDate ? parseTaskDate(taskDate) : undefined}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
