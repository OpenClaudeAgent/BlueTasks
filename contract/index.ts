/**
 * Public HTTP JSON contract for `/api/tasks` and `/api/areas` (Zod).
 * Dev / test only — not used by the production server runtime.
 */
export type {ApiAreaRow} from './schemas/api-area-row.schema.js';
export {apiAreaRowSchema} from './schemas/api-area-row.schema.js';
export type {ApiTaskRow} from './schemas/api-task-row.schema.js';
export {apiTaskRowSchema} from './schemas/api-task-row.schema.js';
