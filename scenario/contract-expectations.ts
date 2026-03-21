import {expect} from '@playwright/test';
import {apiAreaRowSchema} from '../contract/schemas/api-area-row.schema.js';
import {apiTaskRowSchema} from '../contract/schemas/api-task-row.schema.js';

export function expectApiTaskRow(t: unknown): void {
  expect(() => apiTaskRowSchema.parse(t)).not.toThrow();
}

export function expectApiAreaRow(t: unknown): void {
  expect(() => apiAreaRowSchema.parse(t)).not.toThrow();
}
