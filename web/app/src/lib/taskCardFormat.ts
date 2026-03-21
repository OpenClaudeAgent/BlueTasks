import type {Task, TaskPriority} from '../types';

const PRIORITY_ORDER: TaskPriority[] = ['low', 'normal', 'high'];

export function nextPriority(current: TaskPriority): TaskPriority {
  const index = PRIORITY_ORDER.indexOf(current);
  return PRIORITY_ORDER[(index + 1) % PRIORITY_ORDER.length];
}

export function formatEstimateMinutesLabel(
  minutes: number,
  t: (key: string, opts?: {count: number}) => string,
): string {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return t('estimateDays', {count: days});
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return t('estimateHours', {count: minutes / 60});
  }
  return t('estimateMinutesShort', {count: minutes});
}

export function formatTrackedSeconds(task: Task, nowMs: number): number {
  const base = task.timeSpentSeconds ?? 0;
  if (!task.timerStartedAt) {
    return base;
  }
  const start = Date.parse(task.timerStartedAt);
  if (Number.isNaN(start)) {
    return base;
  }
  return base + Math.max(0, Math.floor((nowMs - start) / 1000));
}

export function formatDurationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}
