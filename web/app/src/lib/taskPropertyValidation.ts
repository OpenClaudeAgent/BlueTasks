import type {RecurrenceKind} from '../types';

const RECURRENCE_KINDS = new Set<RecurrenceKind>([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
]);

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
