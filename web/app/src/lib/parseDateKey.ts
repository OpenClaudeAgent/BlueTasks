/**
 * Parse a calendar key (YYYY-MM-DD) to a local Date at noon (stable day boundary).
 */
export function parseTaskDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
