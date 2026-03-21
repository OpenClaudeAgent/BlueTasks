import * as Popover from '@radix-ui/react-popover';
import {useMemo, useRef, useState, type MouseEvent} from 'react';
import {CalendarDays, LoaderCircle, Pin, RotateCw, Timer, Trash2} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {getAreaIconComponent} from '../../lib/areaIcons';
import {formatDurationLabel, formatEstimateMinutesLabel, nextPriority} from '../../lib/taskCardFormat';
import {coercePinned, coerceRecurrence} from '../../lib/tasks';
import {todayKey} from '../../lib/date';
import type {Area, RecurrenceKind, Task, TaskDraftUpdate} from '../../types';
import {ESTIMATE_PRESETS, RECURRENCE_OPTIONS} from './constants';
import {TaskCardPriorityIcon} from './TaskCardPriorityIcon';
import {areaNameByIdMap} from './taskCardModel';

export type TaskCardFooterProps = {
  task: Task;
  areas: Area[];
  isSaving: boolean;
  trackedSeconds: number;
  checklistRatio: number;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onOpenHeaderDatePopover: () => void;
};

export function TaskCardFooter({
  task,
  areas,
  isSaving,
  trackedSeconds,
  checklistRatio,
  onChange,
  onDelete,
  onOpenHeaderDatePopover,
}: TaskCardFooterProps) {
  const {t} = useTranslation();
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const lastTimerToggleAtRef = useRef(0);

  const priority = task.priority ?? 'normal';
  const pinned = coercePinned(task.pinned);
  const recurrence = coerceRecurrence(task.recurrence);

  const estimateLabel =
    task.estimateMinutes != null && task.estimateMinutes > 0
      ? formatEstimateMinutesLabel(task.estimateMinutes, t)
      : t('footerNoEstimate');

  const areaNameById = useMemo(() => areaNameByIdMap(areas), [areas]);

  const areaDisplayName = task.areaId ? areaNameById[task.areaId] ?? null : null;

  const AreaGlyph = useMemo(
    () => getAreaIconComponent(task.areaId ? areas.find((a) => a.id === task.areaId)?.icon : undefined),
    [areas, task.areaId],
  );

  const areaFooterLabel = task.areaId ? (areaDisplayName ?? t('areaMissing')) : t('areaNone');

  const priorityLabel =
    priority === 'low' ? t('priorityShort.low') : priority === 'high' ? t('priorityShort.high') : t('priorityShort.normal');

  return (
    <footer className="taskCard__footerBar">
      <div className="taskCard__footerLeft">
        {!task.taskDate ? <span className="taskCard__footerMeta">{t('later')}</span> : null}

        <Popover.Root onOpenChange={setEstimateOpen} open={estimateOpen}>
          <Popover.Trigger asChild>
            <button className="taskCard__footerEstimateTrigger" title={t('footerEstimate')} type="button">
              <span className="taskCard__srOnly">{t('footerEstimate')}</span>
              {estimateLabel}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="start" className="footerPopover" sideOffset={8}>
              <div className="footerPopover__title">{t('footerEstimate')}</div>
              <div className="footerPopover__options">
                {ESTIMATE_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => {
                      onChange(task.id, {estimateMinutes: minutes});
                      setEstimateOpen(false);
                    }}
                    type="button"
                  >
                    {formatEstimateMinutesLabel(minutes, t)}
                  </button>
                ))}
                <button
                  className="footerPopover__optionMuted"
                  onClick={() => {
                    onChange(task.id, {estimateMinutes: null});
                    setEstimateOpen(false);
                  }}
                  type="button"
                >
                  {t('footerNoEstimate')}
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Popover.Root onOpenChange={setAreaOpen} open={areaOpen}>
          <Popover.Trigger asChild>
            <button className="taskCard__footerAreaTrigger" title={t('areaLabel')} type="button">
              <AreaGlyph aria-hidden size={14} strokeWidth={2} />
              <span className="taskCard__footerAreaTriggerText">{areaFooterLabel}</span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="start" className="footerPopover" sideOffset={8}>
              <div className="footerPopover__title">{t('areaLabel')}</div>
              <div className="footerPopover__options">
                <button
                  className={!task.areaId ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange(task.id, {areaId: null});
                    setAreaOpen(false);
                  }}
                  type="button"
                >
                  {t('areaNone')}
                </button>
                {areas.map((a) => (
                  <button
                    key={a.id}
                    className={task.areaId === a.id ? 'is-selected' : undefined}
                    onClick={() => {
                      onChange(task.id, {areaId: a.id});
                      setAreaOpen(false);
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

        <button
          className="taskCard__footerPriority"
          onClick={() => onChange(task.id, {priority: nextPriority(priority)})}
          title={t('footerCyclePriority')}
          type="button"
        >
          <TaskCardPriorityIcon priority={priority} />
          <span className="taskCard__footerMeta">{t('footerPriority')}</span>
          <span className={`taskCard__footerMeta taskCard__footerMeta--priority-${priority}`}>{priorityLabel}</span>
        </button>

        <span className="taskCard__footerMeta">
          {task.checklistTotal ? t('footerSubtasksPercent', {percent: checklistRatio}) : t('footerNoSubtasks')}
        </span>

        <span className={`taskCard__saveState ${isSaving ? 'is-saving' : ''}`}>
          {isSaving ? <LoaderCircle className="is-spinning" size={12} /> : null}
          {isSaving ? t('saving') : t('allChangesSaved')}
        </span>
      </div>

      <div className="taskCard__footerRight">
        <button
          className={`taskCard__iconBtn ${pinned ? 'is-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onChange(task.id, {pinned: !pinned});
          }}
          title={pinned ? t('unpin') : t('pin')}
          type="button"
        >
          <Pin size={16} />
        </button>
        <button
          className="taskCard__iconBtn"
          onClick={(event) => {
            event.stopPropagation();
            onOpenHeaderDatePopover();
          }}
          title={t('dueDate')}
          type="button"
        >
          <CalendarDays size={16} />
        </button>
        <Popover.Root onOpenChange={setRecurrenceOpen} open={recurrenceOpen}>
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
            <Popover.Content align="end" className="footerPopover" sideOffset={8}>
              <div className="footerPopover__title">{t('recurrence')}</div>
              <div className="footerPopover__options">
                {RECURRENCE_OPTIONS.map(({kind, labelKey}) => (
                  <button
                    key={labelKey}
                    className={recurrence === kind ? 'is-selected' : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      applyRecurrenceSelection(kind);
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
        <button
          aria-label={task.timerStartedAt ? t('timerStop') : t('timerStart')}
          className={`taskCard__iconBtn taskCard__iconBtn--timer ${task.timerStartedAt ? 'is-active' : ''}`}
          onClick={toggleTimer}
          title={task.timerStartedAt ? t('timerStop') : t('timerStart')}
          type="button"
        >
          <Timer aria-hidden size={16} />
          {trackedSeconds > 0 || task.timerStartedAt ? (
            <span aria-hidden className="taskCard__timerLabel">
              {formatDurationLabel(trackedSeconds)}
            </span>
          ) : null}
        </button>
        <button
          className="taskCard__iconBtn taskCard__iconBtn--danger"
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm(t('deleteTaskConfirm', {title: task.title || t('untitledTask')}))) {
              onDelete(task.id);
            }
          }}
          title={t('delete')}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </footer>
  );

  function applyRecurrenceSelection(kind: RecurrenceKind | null) {
    if (kind === null) {
      onChange(task.id, {recurrence: null});
    } else {
      onChange(task.id, {
        recurrence: kind,
        taskDate: task.taskDate ?? todayKey(),
      });
    }
    setRecurrenceOpen(false);
  }

  function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (now - lastTimerToggleAtRef.current < 500) {
      return;
    }
    lastTimerToggleAtRef.current = now;

    if (task.timerStartedAt) {
      const start = Date.parse(task.timerStartedAt);
      const add = Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
      onChange(task.id, {
        timeSpentSeconds: (task.timeSpentSeconds ?? 0) + add,
        timerStartedAt: null,
      });
    } else {
      onChange(task.id, {timerStartedAt: new Date(now).toISOString()});
    }
  }
}
