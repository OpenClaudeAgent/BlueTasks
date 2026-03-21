import {describe, expect, it} from 'vitest';
import {addDaysToKey, formatDateKey, parseTaskDate, todayKey} from './dateKeys';

describe('parseTaskDate / formatDateKey / addDaysToKey', () => {
  it('adds days without drifting the calendar key', () => {
    const key = '2024-03-10';
    const d = parseTaskDate(key);
    expect(formatDateKey(d)).toBe(key);
    expect(addDaysToKey(key, 1)).toBe('2024-03-11');
  });
});

describe('todayKey', () => {
  it('returns a YYYY-MM-DD key', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
