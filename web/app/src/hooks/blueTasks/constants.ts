import type {TaskDraftPayload} from '../../types';

export const SAVE_DELAY_MS = 520;

export type PendingTaskSave = {
  payload: TaskDraftPayload;
  rev: number;
};
