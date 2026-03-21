import type {AreaIconId} from './lib/areaIcons';

export type TaskStatus = 'pending' | 'completed';

export type TaskPriority = 'low' | 'normal' | 'high';

export type RecurrenceKind = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/** Concrete bucket for a single task (sidebar section "All" is not a bucket). */
export type TaskSectionBucket = 'today' | 'upcoming' | 'anytime' | 'done';

/** Primary nav: includes "All" (every task in the current area filter). */
export type SectionId = TaskSectionBucket | 'all';

/** Sidebar filter: `AREA_FILTER_ALL`, `AREA_FILTER_UNCATEGORIZED`, or an area id. */
export const AREA_FILTER_ALL = 'all';
export const AREA_FILTER_UNCATEGORIZED = 'uncategorized';
export type AreaFilter = string;

export type Area = {
  id: string;
  name: string;
  icon: AreaIconId;
  sortIndex: number;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  taskDate: string | null;
  contentJson: string;
  contentText: string;
  checklistTotal: number;
  checklistCompleted: number;
  priority: TaskPriority;
  estimateMinutes: number | null;
  pinned: boolean;
  timeSpentSeconds: number;
  timerStartedAt: string | null;
  recurrence: RecurrenceKind | null;
  /** Area / project (optional). */
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraftPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type TaskDraftUpdate = Partial<TaskDraftPayload>;

export type CreateTaskPayload = TaskDraftPayload & {
  id: string;
};

export type TaskCounts = Record<SectionId, number>;
