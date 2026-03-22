import type {CategoryIconId} from './lib/categoryIcons';

export type TaskStatus = 'pending' | 'completed';

export type TaskPriority = 'low' | 'normal' | 'high';

export type RecurrenceKind = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/** Concrete bucket for a single task (sidebar section "All" is not a bucket). */
export type TaskSectionBucket = 'today' | 'upcoming' | 'anytime' | 'done';

/** Primary nav: includes "All" (every task in the current category filter). */
export type SectionId = TaskSectionBucket | 'all';

/** Sidebar filter: `CATEGORY_FILTER_ALL`, `CATEGORY_FILTER_UNCATEGORIZED`, or a category id. */
export const CATEGORY_FILTER_ALL = 'all';
export const CATEGORY_FILTER_UNCATEGORIZED = 'uncategorized';
export type CategoryFilter = string;

export type Category = {
  id: string;
  name: string;
  icon: CategoryIconId;
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
  /** Category / project (optional). */
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraftPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type TaskDraftUpdate = Partial<TaskDraftPayload>;

export type CreateTaskPayload = TaskDraftPayload & {
  id: string;
};

export type TaskCounts = Record<SectionId, number>;
