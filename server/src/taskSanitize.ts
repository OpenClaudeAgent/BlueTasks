import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';

export type TaskPriority = 'low' | 'normal' | 'high';

export type RecurrenceKind = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type TaskRow = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  taskDate: string | null;
  contentJson: string;
  contentText: string;
  checklistTotal: number;
  checklistCompleted: number;
  priority: TaskPriority;
  estimateMinutes: number | null;
  pinned: boolean;
  timeSpentSeconds: number;
  timerStartedAt: string | null;
  recurrence: RecurrenceKind | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskPayload = Omit<TaskRow, 'createdAt' | 'updatedAt'>;

const RECURRENCE_VALUES = new Set<RecurrenceKind>([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
]);

export function normalizePriority(value: unknown): TaskPriority {
  if (value === 'low' || value === 'high' || value === 'normal') {
    return value;
  }
  return 'normal';
}

export function normalizePinnedInput(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') {
    return true;
  }
  if (typeof value === 'string' && value.toLowerCase() === 'true') {
    return true;
  }
  return false;
}

export function normalizeRecurrence(value: unknown): RecurrenceKind | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string' && RECURRENCE_VALUES.has(value as RecurrenceKind)) {
    return value as RecurrenceKind;
  }
  return null;
}

export function normalizeCategoryId(value: unknown, database: Database.Database): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const found = database.prepare('SELECT 1 FROM categories WHERE id = ?').get(value);
  return found ? value : null;
}

export function emptyEditorState(): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function sanitizePayload(
  input: Partial<TaskPayload>,
  database: Database.Database,
): TaskPayload {
  const checklistTotal = Number.isFinite(input.checklistTotal)
    ? Math.max(0, Number(input.checklistTotal))
    : 0;
  const checklistCompleted = Number.isFinite(input.checklistCompleted)
    ? Math.max(0, Math.min(Number(input.checklistCompleted), checklistTotal))
    : 0;

  let estimateMinutes: number | null = null;
  if (input.estimateMinutes != null) {
    const n = Number(input.estimateMinutes);
    if (Number.isFinite(n) && n > 0) {
      estimateMinutes = Math.min(Math.round(n), 24 * 60);
    }
  }

  let timeSpentSeconds = 0;
  if (input.timeSpentSeconds != null) {
    const n = Number(input.timeSpentSeconds);
    if (Number.isFinite(n) && n >= 0) {
      timeSpentSeconds = Math.min(Math.floor(n), 1e7);
    }
  }

  let timerStartedAt: string | null = null;
  if (typeof input.timerStartedAt === 'string' && input.timerStartedAt) {
    const t = Date.parse(input.timerStartedAt);
    if (!Number.isNaN(t)) {
      timerStartedAt = new Date(t).toISOString();
    }
  }

  return {
    id: typeof input.id === 'string' && input.id ? input.id : randomUUID(),
    title: typeof input.title === 'string' ? input.title.trim() : '',
    status: input.status === 'completed' ? 'completed' : 'pending',
    taskDate:
      typeof input.taskDate === 'string' && isDateKey(input.taskDate) ? input.taskDate : null,
    contentJson:
      typeof input.contentJson === 'string' && input.contentJson
        ? input.contentJson
        : emptyEditorState(),
    contentText: typeof input.contentText === 'string' ? input.contentText : '',
    checklistTotal,
    checklistCompleted,
    priority: normalizePriority(input.priority),
    estimateMinutes,
    pinned: normalizePinnedInput(input.pinned),
    timeSpentSeconds,
    timerStartedAt,
    recurrence: normalizeRecurrence(input.recurrence),
    categoryId: normalizeCategoryId(input.categoryId, database),
  };
}
