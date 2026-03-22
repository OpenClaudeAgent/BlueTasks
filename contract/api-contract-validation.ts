import {apiCategoryRowSchema} from './schemas/api-category-row.schema.js';
import {apiTaskRowSchema} from './schemas/api-task-row.schema.js';

/**
 * Single source for API row contract checks (Zod).
 * Scenario/server modules may re-export these under `expectApi*` names for stable imports.
 */
export function assertApiTaskRowContract(t: unknown): void {
  apiTaskRowSchema.parse(t);
}

export function assertApiCategoryRowContract(t: unknown): void {
  apiCategoryRowSchema.parse(t);
}
