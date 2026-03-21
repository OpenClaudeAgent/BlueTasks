export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToKey(dateKey: string, days: number): string {
  const date = parseTaskDate(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function addMonthsToKey(dateKey: string, months: number): string {
  const date = parseTaskDate(dateKey);
  date.setMonth(date.getMonth() + months);
  return formatDateKey(date);
}

export function addYearsToKey(dateKey: string, years: number): string {
  const date = parseTaskDate(dateKey);
  date.setFullYear(date.getFullYear() + years);
  return formatDateKey(date);
}

export function parseTaskDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

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
