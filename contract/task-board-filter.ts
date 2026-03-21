/**
 * Pure board / area filtering rules (shared with the web client).
 * API returns the full task list; sections are a client concern.
 */

/** Area sidebar: every area */
export const FILTER_AREA_ALL = 'all';
/** Area sidebar: tasks with no area */
export const FILTER_AREA_UNCATEGORIZED = 'uncategorized';

export type TaskSectionBucket = 'today' | 'upcoming' | 'anytime' | 'done';

export type BoardSectionId = TaskSectionBucket | 'all';

export type BoardFilterTask = {
  status: 'pending' | 'completed';
  taskDate: string | null;
  areaId: string | null;
};

export function taskMatchesAreaFilterRow(task: BoardFilterTask, areaFilter: string): boolean {
  if (areaFilter === FILTER_AREA_ALL) {
    return true;
  }
  if (areaFilter === FILTER_AREA_UNCATEGORIZED) {
    return !task.areaId;
  }
  return task.areaId === areaFilter;
}

export function taskMatchesBoardSectionRow(task: BoardFilterTask, section: BoardSectionId, today: string): boolean {
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
