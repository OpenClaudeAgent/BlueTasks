import {
  getTaskSectionBucket,
  taskMatchesAreaFilterRow,
  taskMatchesBoardSectionRow,
  type BoardSectionId,
} from '@bluetasks/contract/task-board-filter.js';
import {todayKey} from './dateKeys';
import {createEmptyEditorState, lexicalDocsContentEqual} from './editorState';
import {
  AREA_FILTER_ALL,
  AREA_FILTER_UNCATEGORIZED,
  type Area,
  type AreaFilter,
  type SectionId,
  type Task,
  type TaskCounts,
  type TaskDraftPayload,
  type TaskSectionBucket,
} from '../types';
import {coercePinned, coerceRecurrence} from './taskPropertyValidation';

export const sectionOrder: SectionId[] = ['all', 'today', 'upcoming', 'anytime', 'done'];

export type {TaskSectionBucket} from '../types';

export {coercePinned, coerceRecurrence} from './taskPropertyValidation';

/** New task: no default due date (area is not forced here either); the user sets them on the card. */
export function createTask(title: string, areaId: string | null = null): Task {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: title.trim() || 'Untitled task',
    status: 'pending',
    taskDate: null,
    contentJson: createEmptyEditorState(),
    contentText: '',
    checklistTotal: 0,
    checklistCompleted: 0,
    priority: 'normal',
    estimateMinutes: null,
    pinned: false,
    timeSpentSeconds: 0,
    timerStartedAt: null,
    recurrence: null,
    areaId,
    createdAt: now,
    updatedAt: now,
  };
}

export function toTaskDraftPayload(task: Task): TaskDraftPayload {
  return {
    title: task.title,
    status: task.status,
    taskDate: task.taskDate,
    contentJson: task.contentJson,
    contentText: task.contentText,
    checklistTotal: task.checklistTotal,
    checklistCompleted: task.checklistCompleted,
    priority: task.priority,
    estimateMinutes: task.estimateMinutes,
    pinned: coercePinned(task.pinned),
    timeSpentSeconds: task.timeSpentSeconds,
    timerStartedAt: task.timerStartedAt,
    recurrence: coerceRecurrence(task.recurrence),
    areaId: typeof task.areaId === 'string' && task.areaId ? task.areaId : null,
  };
}

/** Normalize fields from API / SQLite (load + PUT response). */
export function mergeTaskFromApi(task: Task): Task {
  return {
    ...task,
    priority: task.priority ?? 'normal',
    estimateMinutes: task.estimateMinutes ?? null,
    pinned: coercePinned(task.pinned),
    timeSpentSeconds: task.timeSpentSeconds ?? 0,
    timerStartedAt: task.timerStartedAt ?? null,
    recurrence: coerceRecurrence(task.recurrence),
    areaId: typeof task.areaId === 'string' && task.areaId ? task.areaId : null,
  };
}

/**
 * After PUT: keep local Lexical JSON/text when semantically equal to the server copy,
 * so the editor does not see a prop change and re-emit onChange (autosave ping-pong).
 */
export function applySavedTaskPreservingLexicalShape(local: Task, savedNormalized: Task): Task {
  const localJson = local.contentJson?.trim() || createEmptyEditorState();
  const remoteJson = savedNormalized.contentJson?.trim() || createEmptyEditorState();
  if (lexicalDocsContentEqual(localJson, remoteJson)) {
    return {
      ...savedNormalized,
      contentJson: local.contentJson,
      contentText: local.contentText,
    };
  }
  return savedNormalized;
}

/** True if a newer local edit was queued while this PUT was in flight. */
export function isSaveSuperseded(sentRev: number, pending: {rev: number} | undefined): boolean {
  return pending !== undefined && pending.rev !== sentRev;
}

function toBoardFilterTask(task: Task) {
  return {
    status: task.status,
    taskDate: task.taskDate,
    areaId: task.areaId,
  };
}

export function filterTasks(
  tasks: Task[],
  section: SectionId,
  areaFilter: AreaFilter = AREA_FILTER_ALL,
): Task[] {
  const today = todayKey();

  return sortTasks(
    tasks.filter((task) => {
      if (!taskMatchesAreaFilterRow(toBoardFilterTask(task), areaFilter)) {
        return false;
      }
      return taskMatchesBoardSectionRow(toBoardFilterTask(task), section as BoardSectionId, today);
    }),
  );
}

/** One pass over tasks: counts per area row for the sidebar (same rules as `filterTasks`, without sorting). */
export function getAreaSidebarCounts(
  tasks: Task[],
  selectedSection: SectionId,
  areas: Area[],
): {
  all: number;
  uncategorized: number;
  byId: Record<string, number>;
} {
  const today = todayKey();
  const section = selectedSection as BoardSectionId;
  const byId: Record<string, number> = {};
  for (const area of areas) {
    byId[area.id] = 0;
  }
  let all = 0;
  let uncategorized = 0;

  for (const task of tasks) {
    const row = toBoardFilterTask(task);
    if (!taskMatchesBoardSectionRow(row, section, today)) {
      continue;
    }
    if (taskMatchesAreaFilterRow(row, AREA_FILTER_ALL)) {
      all++;
    }
    if (taskMatchesAreaFilterRow(row, AREA_FILTER_UNCATEGORIZED)) {
      uncategorized++;
    }
    for (const area of areas) {
      if (taskMatchesAreaFilterRow(row, area.id)) {
        byId[area.id]++;
      }
    }
  }

  return {all, uncategorized, byId};
}

export function getTaskCounts(tasks: Task[], areaFilter: AreaFilter = AREA_FILTER_ALL): TaskCounts {
  return {
    all: filterTasks(tasks, 'all', areaFilter).length,
    today: filterTasks(tasks, 'today', areaFilter).length,
    upcoming: filterTasks(tasks, 'upcoming', areaFilter).length,
    anytime: filterTasks(tasks, 'anytime', areaFilter).length,
    done: filterTasks(tasks, 'done', areaFilter).length,
  };
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'completed' ? 1 : -1;
    }

    const lp = coercePinned(left.pinned) ? 1 : 0;
    const rp = coercePinned(right.pinned) ? 1 : 0;
    if (lp !== rp) {
      return rp - lp;
    }

    const leftDate = left.taskDate ?? '9999-12-31';
    const rightDate = right.taskDate ?? '9999-12-31';
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    // Stable order: do not use updatedAt (opening the editor bumps it and reshuffles the list).
    const byCreated = left.createdAt.localeCompare(right.createdAt);
    if (byCreated !== 0) {
      return byCreated;
    }

    return left.id.localeCompare(right.id);
  });
}

export function getPreferredTaskId(
  tasks: Task[],
  selectedSection: SectionId,
  selectedTaskId: string | null,
  areaFilter: AreaFilter = AREA_FILTER_ALL,
): string | null {
  const visibleTasks = filterTasks(tasks, selectedSection, areaFilter);
  if (visibleTasks.length === 0) {
    return null;
  }

  if (selectedTaskId && visibleTasks.some((task) => task.id === selectedTaskId)) {
    return selectedTaskId;
  }

  return visibleTasks[0].id;
}

export function getTaskSection(task: Task): TaskSectionBucket {
  return getTaskSectionBucket(toBoardFilterTask(task), todayKey());
}
