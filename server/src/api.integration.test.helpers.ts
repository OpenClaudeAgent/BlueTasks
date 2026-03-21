import {expect} from 'vitest';
import {assertApiAreaRowContract, assertApiTaskRowContract} from '../../contract/api-contract-validation.js';

/** Shape returned by GET /api/tasks after server mapping (stable contract for clients). */
export function expectApiTaskRow(t: unknown): void {
  expect(() => assertApiTaskRowContract(t)).not.toThrow();
}

/** Shape returned by GET/POST/PUT `/api/areas`. */
export function expectApiAreaRow(t: unknown): void {
  expect(() => assertApiAreaRowContract(t)).not.toThrow();
}
