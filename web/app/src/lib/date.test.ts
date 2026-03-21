import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {addDaysToKey, formatDateKey, getDateTone, parseTaskDate, todayKey} from './date';

describe('getDateTone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('détecte en retard, aujourd’hui et à venir', () => {
    expect(getDateTone(null)).toBe('none');
    expect(getDateTone('2024-06-14')).toBe('overdue');
    expect(getDateTone('2024-06-15')).toBe('today');
    expect(getDateTone('2024-06-16')).toBe('upcoming');
  });
});

describe('parseTaskDate / formatDateKey / addDaysToKey', () => {
  it('boucle une date sans dériver', () => {
    const key = '2024-03-10';
    const d = parseTaskDate(key);
    expect(formatDateKey(d)).toBe(key);
    expect(addDaysToKey(key, 1)).toBe('2024-03-11');
  });
});

describe('todayKey', () => {
  it('renvoie une clé YYYY-MM-DD', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
