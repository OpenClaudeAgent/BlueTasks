import {addDaysToKey, addMonthsToKey, addYearsToKey} from './dateKeys';
import type {RecurrenceKind} from '../types';

export function advanceRecurrenceDate(dateKey: string, kind: RecurrenceKind): string {
  switch (kind) {
    case 'daily':
      return addDaysToKey(dateKey, 1);
    case 'weekly':
      return addDaysToKey(dateKey, 7);
    case 'biweekly':
      return addDaysToKey(dateKey, 14);
    case 'monthly':
      return addMonthsToKey(dateKey, 1);
    case 'yearly':
      return addYearsToKey(dateKey, 1);
    default:
      return dateKey;
  }
}
