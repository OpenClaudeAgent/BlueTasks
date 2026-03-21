import {describe, expect, it} from 'vitest';
import type {RecurrenceKind} from '../types';
import {advanceRecurrenceDate} from './recurrence';

describe('advanceRecurrenceDate', () => {
  it('avance selon le type de récurrence', () => {
    const base = '2024-06-10';
    expect(advanceRecurrenceDate(base, 'daily')).toBe('2024-06-11');
    expect(advanceRecurrenceDate(base, 'weekly')).toBe('2024-06-17');
    expect(advanceRecurrenceDate(base, 'biweekly')).toBe('2024-06-24');
    expect(advanceRecurrenceDate(base, 'monthly')).toBe('2024-07-10');
    expect(advanceRecurrenceDate(base, 'yearly')).toBe('2025-06-10');
  });

  it('renvoie la date inchangée pour une valeur hors union (défensive)', () => {
    expect(advanceRecurrenceDate('2024-06-10', 'bogus' as RecurrenceKind)).toBe('2024-06-10');
  });
});
