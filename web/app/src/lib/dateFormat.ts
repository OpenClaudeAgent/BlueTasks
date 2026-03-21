import {parseTaskDate, todayKey} from './dateKeys';

export function formatTaskDate(dateKey: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
  }).format(parseTaskDate(dateKey));
}

/** Compact pill label for task dates, e.g. "FEB 20" (uppercase month for English). */
export function formatTaskDatePill(dateKey: string, language: string): string {
  const d = parseTaskDate(dateKey);
  const month = new Intl.DateTimeFormat(language, {month: 'short'}).format(d).toUpperCase();
  const day = d.getDate();
  return `${month} ${day}`;
}

export function getDateTone(dateKey: string | null): 'none' | 'overdue' | 'today' | 'upcoming' {
  if (!dateKey) {
    return 'none';
  }

  const today = todayKey();
  if (dateKey < today) {
    return 'overdue';
  }

  if (dateKey === today) {
    return 'today';
  }

  return 'upcoming';
}
