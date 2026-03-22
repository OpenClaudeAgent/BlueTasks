import type {Locale} from 'date-fns';
import type {Dispatch, SetStateAction} from 'react';
import {useCallback, useMemo} from 'react';
import type {LucideIcon} from 'lucide-react';
import {getCategoryIconComponent} from '../../lib/categoryIcons';
import {formatTaskDatePill, getDateTone} from '../../lib/dateFormat';
import {formatTrackedSeconds} from '../../lib/taskCardFormat';
import {dayPickerLocaleFor} from '../../lib/dayPickerLocale';
import {coercePinned, coerceRecurrence} from '../../lib/taskPropertyValidation';
import type {Category, Task, TaskDraftUpdate} from '../../types';
import {categoryNameByIdMap, checklistCompletionRatio} from './taskCardModel';
import type {TaskCardFooterProps} from './TaskCardFooter';

export type TaskCardBoardChrome = {
  datePopoverTaskId: string | null;
  setDatePopoverTaskId: Dispatch<SetStateAction<string | null>>;
  liveTimerNowMs: number;
};

export type TaskCardChrome = {
  dateOpen: boolean;
  setDateOpen: (open: boolean) => void;
  datePillLabel: string | null;
  dateTone: ReturnType<typeof getDateTone>;
  dayPickerLocale: Locale;
  trackedSeconds: number;
  pinned: boolean;
  recurrence: ReturnType<typeof coerceRecurrence>;
  CategoryGlyph: LucideIcon;
  categoryDisplayName: string | null;
  updateDate: (dateKey: string | null) => void;
  footerProps: TaskCardFooterProps;
};

/**
 * Header/footer derivations for a task card. Date popover state and the shared timer clock come from the board.
 */
export function useTaskCardChrome(
  task: Task,
  categories: Category[],
  language: string,
  isSaving: boolean,
  onChange: (taskId: string, update: TaskDraftUpdate) => void,
  onDelete: (taskId: string) => void,
  board: TaskCardBoardChrome,
): TaskCardChrome {
  const {datePopoverTaskId, setDatePopoverTaskId, liveTimerNowMs} = board;
  const dateOpen = datePopoverTaskId === task.id;

  const setDateOpen = useCallback(
    (open: boolean) => {
      setDatePopoverTaskId((current) => {
        if (open) {
          return task.id;
        }
        return current === task.id ? null : current;
      });
    },
    [setDatePopoverTaskId, task.id],
  );

  const trackedSeconds = formatTrackedSeconds(task, liveTimerNowMs);

  const checklistRatio = useMemo(
    () => checklistCompletionRatio(task.checklistCompleted, task.checklistTotal),
    [task.checklistCompleted, task.checklistTotal],
  );

  const datePillLabel = task.taskDate ? formatTaskDatePill(task.taskDate, language) : null;
  const dateTone = getDateTone(task.taskDate);
  const pinned = coercePinned(task.pinned);
  const recurrence = coerceRecurrence(task.recurrence);

  const nameById = useMemo(() => categoryNameByIdMap(categories), [categories]);
  const categoryDisplayName = task.categoryId ? (nameById[task.categoryId] ?? null) : null;

  const CategoryGlyph = useMemo(
    () =>
      getCategoryIconComponent(
        task.categoryId ? categories.find((c) => c.id === task.categoryId)?.icon : undefined,
      ),
    [categories, task.categoryId],
  );

  const updateDate = useCallback(
    (dateKey: string | null) => {
      onChange(task.id, {taskDate: dateKey, recurrence: null});
      setDatePopoverTaskId((current) => (current === task.id ? null : current));
    },
    [onChange, setDatePopoverTaskId, task.id],
  );

  const onOpenHeaderDatePopover = useCallback(() => setDateOpen(true), [setDateOpen]);

  const footerProps = useMemo<TaskCardFooterProps>(
    () => ({
      taskId: task.id,
      taskTitle: task.title,
      taskDate: task.taskDate,
      estimateMinutes: task.estimateMinutes,
      categoryId: task.categoryId,
      priority: task.priority ?? 'normal',
      pinned,
      recurrence,
      timerStartedAt: task.timerStartedAt,
      timeSpentSeconds: task.timeSpentSeconds,
      checklistTotal: task.checklistTotal,
      categoryGlyph: CategoryGlyph,
      categories,
      isSaving,
      trackedSeconds,
      checklistRatio,
      onChange,
      onDelete,
      onOpenHeaderDatePopover,
    }),
    [
      CategoryGlyph,
      categories,
      checklistRatio,
      isSaving,
      onChange,
      onDelete,
      onOpenHeaderDatePopover,
      pinned,
      recurrence,
      task.categoryId,
      task.estimateMinutes,
      task.id,
      task.priority,
      task.taskDate,
      task.timeSpentSeconds,
      task.timerStartedAt,
      task.title,
      task.checklistTotal,
      trackedSeconds,
    ],
  );

  const dayPickerLocale: Locale = dayPickerLocaleFor(language);

  return {
    dateOpen,
    setDateOpen,
    datePillLabel,
    dateTone,
    dayPickerLocale,
    trackedSeconds,
    pinned,
    recurrence,
    CategoryGlyph,
    categoryDisplayName,
    updateDate,
    footerProps,
  };
}
