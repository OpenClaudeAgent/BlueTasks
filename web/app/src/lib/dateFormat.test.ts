import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {formatTaskDate, formatTaskDatePill, getDateTone} from './dateFormat';

describe('getDateTone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies overdue, today, and upcoming', () => {
    expect(getDateTone(null)).toBe('none');
    expect(getDateTone('2024-06-14')).toBe('overdue');
    expect(getDateTone('2024-06-15')).toBe('today');
    expect(getDateTone('2024-06-16')).toBe('upcoming');
  });
});

describe('Feature: Task date presentation', () => {
  describe('Scenario: User sees a formatted date in the UI', () => {
    it('given a calendar key and en-US, when formatTaskDate runs, then Intl returns a non-empty localized string', () => {
      const label = formatTaskDate('2024-06-15', 'en-US');
      expect(label.length).toBeGreaterThan(0);
      expect(label).toMatch(/\d/);
    });

    it('given a calendar key and en-US, when formatTaskDatePill runs, then it returns uppercase month token and day', () => {
      const pill = formatTaskDatePill('2024-06-15', 'en-US');
      expect(pill).toMatch(/^[A-Z]{3,9} \d{1,2}$/);
    });
  });
});
