import type {AreaIconId} from './lib/areaIcons';

export type TaskStatus = 'pending' | 'completed';

export type TaskPriority = 'low' | 'normal' | 'high';

export type RecurrenceKind = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type SectionId = 'today' | 'upcoming' | 'anytime' | 'done';

/** Filtre latéral : `AREA_FILTER_ALL`, `AREA_FILTER_UNCATEGORIZED`, ou id d’une zone. */
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
  /** Zone / projet (optionnel). */
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraftPayload = {
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
  areaId: string | null;
};

export type TaskDraftUpdate = Partial<TaskDraftPayload>;

export type CreateTaskPayload = TaskDraftPayload & {
  id: string;
};

export type TaskCounts = Record<SectionId, number>;
