/**
 * Public HTTP JSON contract for `/api/tasks` and `/api/categories` (Zod).
 * Dev / test only — not used by the production server runtime.
 */
export type {ApiCategoryRow} from './schemas/api-category-row.schema.js';
export {apiCategoryRowSchema} from './schemas/api-category-row.schema.js';
export type {ApiTaskRow} from './schemas/api-task-row.schema.js';
export {apiTaskRowSchema} from './schemas/api-task-row.schema.js';
export {assertApiCategoryRowContract, assertApiTaskRowContract} from './api-contract-validation.js';
