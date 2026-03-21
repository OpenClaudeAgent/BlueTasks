/**
 * Calendar-key helpers (YYYY-MM-DD) only — no Intl or UI-oriented formatting.
 * Keeps recurrence / task section logic separate from presentation (`dateFormat.ts`).
 */

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
