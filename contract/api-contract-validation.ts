import {apiAreaRowSchema} from './schemas/api-area-row.schema.js';
import {apiTaskRowSchema} from './schemas/api-task-row.schema.js';

/**
 * Single source for API row contract checks (Zod).
 * Test helpers (Playwright / Vitest) wrap these with their own `expect`.
 */
export function assertApiTaskRowContract(t: unknown): void {
  apiTaskRowSchema.parse(t);
}

export function assertApiAreaRowContract(t: unknown): void {
  apiAreaRowSchema.parse(t);
}
