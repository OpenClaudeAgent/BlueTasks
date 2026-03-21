import type {RecurrenceKind} from '../../types';

export const ESTIMATE_PRESETS = [30, 60, 120, 240, 1440] as const;

export const RECURRENCE_OPTIONS: {kind: RecurrenceKind | null; labelKey: string}[] = [
  {kind: null, labelKey: 'recurrenceOff'},
  {kind: 'daily', labelKey: 'recurrenceDaily'},
  {kind: 'weekly', labelKey: 'recurrenceWeekly'},
  {kind: 'biweekly', labelKey: 'recurrenceBiweekly'},
  {kind: 'monthly', labelKey: 'recurrenceMonthly'},
  {kind: 'yearly', labelKey: 'recurrenceYearly'},
];
