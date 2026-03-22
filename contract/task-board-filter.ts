/**
 * Pure board / category filtering rules (shared with the web client).
 * API returns the full task list; sections are a client concern.
 */

/** Category sidebar: every category */
export const FILTER_CATEGORY_ALL = 'all';
/** Category sidebar: tasks with no category */
export const FILTER_CATEGORY_UNCATEGORIZED = 'uncategorized';

export type TaskSectionBucket = 'today' | 'upcoming' | 'anytime' | 'done';

export type BoardSectionId = TaskSectionBucket | 'all';

export type BoardFilterTask = {
  status: 'pending' | 'completed';
  taskDate: string | null;
  categoryId: string | null;
};

export function taskMatchesCategoryFilterRow(
  task: BoardFilterTask,
  categoryFilter: string,
): boolean {
  if (categoryFilter === FILTER_CATEGORY_ALL) {
    return true;
  }
  if (categoryFilter === FILTER_CATEGORY_UNCATEGORIZED) {
    return !task.categoryId;
  }
  return task.categoryId === categoryFilter;
}

export function taskMatchesBoardSectionRow(
  task: BoardFilterTask,
  section: BoardSectionId,
  today: string,
): boolean {
  if (section === 'all') {
    return true;
  }

  if (section === 'done') {
    return task.status === 'completed';
  }

  if (task.status === 'completed') {
    return false;
  }

  if (section === 'today') {
    return Boolean(task.taskDate && task.taskDate <= today);
  }

  if (section === 'upcoming') {
    return Boolean(task.taskDate && task.taskDate > today);
  }

  return !task.taskDate;
}

export function getTaskSectionBucket(task: BoardFilterTask, today: string): TaskSectionBucket {
  if (task.status === 'completed') {
    return 'done';
  }
  if (!task.taskDate) {
    return 'anytime';
  }
  return task.taskDate <= today ? 'today' : 'upcoming';
}
