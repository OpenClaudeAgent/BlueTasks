import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {enUS, fr as frLocale} from 'date-fns/locale';
import {useTranslation} from 'react-i18next';
import {formatTaskDatePill, getDateTone} from '../lib/date';
import {formatTrackedSeconds} from '../lib/taskCardFormat';
import {getAreaIconComponent} from '../lib/areaIcons';
import {coercePinned, coerceRecurrence} from '../lib/tasks';
import type {Area, Task, TaskDraftUpdate} from '../types';
import {TaskCardExpandedBody} from './taskCard/TaskCardExpandedBody';
import {TaskCardHeaderRow} from './taskCard/TaskCardHeaderRow';
import {areaNameByIdMap, checklistCompletionRatio} from './taskCard/taskCardModel';
import {useAutoFocusTaskTitle} from './taskCard/useAutoFocusTaskTitle';

type TaskCardProps = {
  task: Task;
  areas: Area[];
  expanded: boolean;
  /** Premier rendu étendu : focus sur le champ titre (ex. après « Ajouter »). */
  autoFocusTitle?: boolean;
  onAutoFocusTitleConsumed?: () => void;
  isSaving: boolean;
  onToggleExpand: () => void;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
};

export function TaskCard({
  task,
  areas,
  expanded,
  autoFocusTitle = false,
  onAutoFocusTitleConsumed,
  isSaving,
  onToggleExpand,
  onChange,
  onDelete,
  onToggleStatus,
}: TaskCardProps) {
  const {i18n} = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    if (!task.timerStartedAt) {
      return;
    }
    const id = window.setInterval(() => setTimerTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [task.timerStartedAt, task.id]);

  const trackedSeconds = formatTrackedSeconds(task, Date.now());

  useAutoFocusTaskTitle({
    autoFocusTitle,
    expanded,
    onConsumed: onAutoFocusTitleConsumed,
    taskId: task.id,
    titleInputRef,
  });

  const checklistRatio = useMemo(
    () => checklistCompletionRatio(task.checklistCompleted, task.checklistTotal),
    [task.checklistCompleted, task.checklistTotal],
  );

  const datePillLabel = task.taskDate ? formatTaskDatePill(task.taskDate, i18n.language) : null;
  const dateTone = getDateTone(task.taskDate);
  const pinned = coercePinned(task.pinned);
  const recurrence = coerceRecurrence(task.recurrence);

  const areaNameById = useMemo(() => areaNameByIdMap(areas), [areas]);

  const areaDisplayName = task.areaId ? areaNameById[task.areaId] ?? null : null;

  const AreaGlyph = useMemo(
    () => getAreaIconComponent(task.areaId ? areas.find((a) => a.id === task.areaId)?.icon : undefined),
    [areas, task.areaId],
  );

  const updateDate = useCallback(
    (dateKey: string | null) => {
      onChange(task.id, {taskDate: dateKey, recurrence: null});
      setDateOpen(false);
    },
    [onChange, task.id],
  );

  return (
    <article className={`taskCard ${expanded ? 'is-expanded' : ''} ${task.status === 'completed' ? 'is-completed' : ''}`}>
      <TaskCardHeaderRow
        AreaGlyph={AreaGlyph}
        areaDisplayName={areaDisplayName}
        dateOpen={dateOpen}
        datePillLabel={datePillLabel}
        dateTone={dateTone}
        dayPickerLocale={i18n.language === 'fr' ? frLocale : enUS}
        expanded={expanded}
        onChange={onChange}
        onDateOpenChange={setDateOpen}
        onSelectDate={updateDate}
        onToggleExpand={onToggleExpand}
        onToggleStatus={onToggleStatus}
        pinned={pinned}
        recurrence={recurrence}
        task={task}
        titleInputRef={titleInputRef}
        trackedSeconds={trackedSeconds}
      />

      {expanded ? (
        <TaskCardExpandedBody
          areas={areas}
          checklistRatio={checklistRatio}
          isSaving={isSaving}
          onChange={onChange}
          onDelete={onDelete}
          onOpenHeaderDatePopover={() => setDateOpen(true)}
          task={task}
          trackedSeconds={trackedSeconds}
        />
      ) : null}
    </article>
  );
}
