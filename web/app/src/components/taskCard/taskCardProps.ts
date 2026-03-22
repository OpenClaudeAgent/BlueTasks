import type {TaskCardBoardChrome} from './useTaskCardChrome';
import type {Category, Task, TaskDraftUpdate} from '../../types';

export type TaskCardProps = {
  task: Task;
  categories: Category[];
  boardChrome: TaskCardBoardChrome;
  expanded: boolean;
  /** First expanded render: focus the title field (e.g. after Add). */
  autoFocusTitle?: boolean;
  onAutoFocusTitleConsumed?: () => void;
  isSaving: boolean;
  onToggleExpandTask: (taskId: string) => void;
  onChange: (taskId: string, update: TaskDraftUpdate) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
};

/** Memo comparator: skip re-render on timer tick when task has no active timer. */
export function taskCardPropsAreEqual(prev: TaskCardProps, next: TaskCardProps): boolean {
  if (prev.task !== next.task) {
    return false;
  }
  if (prev.categories !== next.categories) {
    return false;
  }
  if (prev.expanded !== next.expanded) {
    return false;
  }
  if (prev.autoFocusTitle !== next.autoFocusTitle) {
    return false;
  }
  if (prev.isSaving !== next.isSaving) {
    return false;
  }
  if (prev.onToggleExpandTask !== next.onToggleExpandTask) {
    return false;
  }
  if (prev.onChange !== next.onChange) {
    return false;
  }
  if (prev.onDelete !== next.onDelete) {
    return false;
  }
  if (prev.onToggleStatus !== next.onToggleStatus) {
    return false;
  }
  if (prev.onAutoFocusTitleConsumed !== next.onAutoFocusTitleConsumed) {
    return false;
  }

  const pb = prev.boardChrome;
  const nb = next.boardChrome;
  if (pb.datePopoverTaskId !== nb.datePopoverTaskId) {
    return false;
  }
  if (pb.setDatePopoverTaskId !== nb.setDatePopoverTaskId) {
    return false;
  }

  if (next.task.timerStartedAt) {
    if (pb.liveTimerNowMs !== nb.liveTimerNowMs) {
      return false;
    }
  }

  return true;
}
