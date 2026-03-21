import {expect} from 'vitest';
import {apiAreaRowSchema} from '../../contract/schemas/api-area-row.schema.js';
import {apiTaskRowSchema} from '../../contract/schemas/api-task-row.schema.js';

/** Shape returned by GET /api/tasks after server mapping (stable contract for clients). */
export function expectApiTaskRow(t: unknown): void {
  expect(() => apiTaskRowSchema.parse(t)).not.toThrow();
}

/** Shape returned by GET/POST/PUT `/api/areas`. */
export function expectApiAreaRow(t: unknown): void {
  expect(() => apiAreaRowSchema.parse(t)).not.toThrow();
}
