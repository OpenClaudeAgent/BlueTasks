import {todayKey} from './date';
import {advanceRecurrenceDate} from './recurrence';
import {createEmptyEditorState, lexicalDocsContentEqual} from './editorState';
import {
  AREA_FILTER_ALL,
  AREA_FILTER_UNCATEGORIZED,
  type AreaFilter,
  type RecurrenceKind,
  type SectionId,
  type Task,
  type TaskCounts,
  type TaskDraftPayload,
} from '../types';

export const sectionOrder: SectionId[] = ['today', 'upcoming', 'anytime', 'done'];

const RECURRENCE_KINDS = new Set<RecurrenceKind>(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']);

/** SQLite / JSON may expose pinned as 0/1; avoid Boolean("0") === true. */
export function coercePinned(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export function coerceRecurrence(value: unknown): RecurrenceKind | null {
  if (typeof value === 'string' && RECURRENCE_KINDS.has(value as RecurrenceKind)) {
    return value as RecurrenceKind;
  }
  return null;
}

/** Nouvelle tâche : pas de date par défaut (ni zone imposée ailleurs) — l’utilisateur choisit dans la carte. */
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

export function taskMatchesAreaFilter(task: Task, filter: AreaFilter): boolean {
  if (filter === AREA_FILTER_ALL) {
    return true;
  }
  if (filter === AREA_FILTER_UNCATEGORIZED) {
    return !task.areaId;
  }
  return task.areaId === filter;
}

export function filterTasks(
  tasks: Task[],
  section: SectionId,
  areaFilter: AreaFilter = AREA_FILTER_ALL,
): Task[] {
  const today = todayKey();

  return sortTasks(
    tasks.filter((task) => {
      if (!taskMatchesAreaFilter(task, areaFilter)) {
        return false;
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
    }),
  );
}

export function getTaskCounts(tasks: Task[], areaFilter: AreaFilter = AREA_FILTER_ALL): TaskCounts {
  return {
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

/** When marking a recurring task “done”, advance the due date instead of moving to completed. */
export function applyRecurringStatusToggle(task: Task): Task {
  if (task.status !== 'pending' || !task.recurrence) {
    return {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
    };
  }

  const base = task.taskDate ?? todayKey();
  return {
    ...task,
    taskDate: advanceRecurrenceDate(base, task.recurrence),
    status: 'pending',
  };
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

export function getTaskSection(task: Task): SectionId {
  if (task.status === 'completed') {
    return 'done';
  }

  if (!task.taskDate) {
    return 'anytime';
  }

  return task.taskDate <= todayKey() ? 'today' : 'upcoming';
}

