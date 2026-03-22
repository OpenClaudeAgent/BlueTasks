/**
 * Pure helpers shared by TaskCard, footer, and any extracted picker subcomponents.
 * Prefer importing from here over duplicating maps/ratios or adding a parallel “model” module.
 */
import type {Category} from '../../types';

export function checklistCompletionRatio(completed: number, total: number): number {
  if (!total) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

export function categoryNameByIdMap(categories: Category[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.id] = c.name;
  }
  return map;
}
