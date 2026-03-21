import type {Locale} from 'date-fns';
import {Check, ChevronDown, Pin, RotateCw, Timer, type LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {RefObject} from 'react';
import {formatDurationLabel} from '../../lib/taskCardFormat';
import type {RecurrenceKind, Task, TaskDraftUpdate} from '../../types';
import {TaskCardHeaderDatePopover} from './TaskCardHeaderDatePopover';

export type TaskCardHeaderRowProps = {
  task: Task;
  expanded: boolean;
  titleInputRef: RefObject<HTMLInputElement | null>;
  pinned: boolean;
  recurrence: RecurrenceKind | null;
  areaDisplayName: string | null;
  AreaGlyph: LucideIcon;
  trackedSeconds: number;
  dateOpen: boolean;
  onDateOpenChange: (open: boolean) => void;
  datePillLabel: string | null;
  dateTone: string;
  dayPickerLocale: Locale;
  onSelectDate: (dateKey: string | null) => void;
  onToggleExpand: () => void;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onToggleStatus: (taskId: string) => void;
};

export function TaskCardHeaderRow({
  task,
  expanded,
  titleInputRef,
  pinned,
  recurrence,
  areaDisplayName,
  AreaGlyph,
  trackedSeconds,
  dateOpen,
  onDateOpenChange,
  datePillLabel,
  dateTone,
  dayPickerLocale,
  onSelectDate,
  onToggleExpand,
  onChange,
  onToggleStatus,
}: TaskCardHeaderRowProps) {
  const {t} = useTranslation();

  return (
    <div className={`taskCard__row ${expanded ? '' : 'taskCard__row--collapsible'}`}>
      <button
        aria-label={
          task.status === 'completed'
            ? t('markAsOpen')
            : recurrence
              ? t('markRecurrenceDone')
              : t('markAsDone')
        }
        className={`taskCard__status ${task.status === 'completed' ? 'is-checked' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleStatus(task.id);
        }}
        type="button"
      >
        <Check size={12} strokeWidth={2.5} />
      </button>

      <div className="taskCard__titleZone">
        {expanded ? (
          <input
            ref={titleInputRef}
            aria-label={t('taskTitle')}
            className="taskCard__titleInput taskCard__titleInput--inline"
            onBlur={() => onChange(task.id, {title: task.title.trim()})}
            onChange={(event) => onChange(task.id, {title: event.target.value})}
            onClick={(event) => event.stopPropagation()}
            placeholder={t('untitledTask')}
            value={task.title}
          />
        ) : (
          <button className="taskCard__titleButton" onClick={onToggleExpand} type="button">
            <span className="taskCard__title">{task.title || t('untitledTask')}</span>
          </button>
        )}
      </div>

      <div className="taskCard__rowTrailing">
        {task.areaId ? (
          <span className="taskCard__chip taskCard__chip--area" title={t('areaLabel')}>
            <AreaGlyph aria-hidden size={11} strokeWidth={2.5} />
            <span className="taskCard__areaChipText">{areaDisplayName ?? t('areaMissing')}</span>
          </span>
        ) : null}
        {pinned ? (
          <span className="taskCard__chip taskCard__chip--pin" title={t('pin')}>
            <Pin aria-hidden size={11} strokeWidth={2.5} />
            {t('pinnedBadge')}
          </span>
        ) : null}
        {recurrence ? (
          <span className="taskCard__chip taskCard__chip--recurring" title={t('recurrence')}>
            <RotateCw aria-hidden size={11} strokeWidth={2.5} />
            {t(`recurrenceChip.${recurrence}`)}
          </span>
        ) : null}
        {task.timerStartedAt ? (
          <span className="taskCard__chip taskCard__chip--timer" title={t('timerRunning')}>
            <Timer aria-hidden size={11} strokeWidth={2.5} />
            {formatDurationLabel(trackedSeconds)}
          </span>
        ) : null}

        <TaskCardHeaderDatePopover
          datePillLabel={datePillLabel}
          dateTone={dateTone}
          dayPickerLocale={dayPickerLocale}
          onOpenChange={onDateOpenChange}
          onSelectDate={onSelectDate}
          open={dateOpen}
          recurrence={recurrence}
          taskDate={task.taskDate}
        />
      </div>

      <button
        aria-expanded={expanded}
        aria-label={expanded ? t('collapseTask') : t('expandTask')}
        className="taskCard__chevronBtn"
        onClick={onToggleExpand}
        type="button"
      >
        <ChevronDown className={`taskCard__chevron ${expanded ? 'is-open' : ''}`} size={18} />
      </button>
    </div>
  );
}
