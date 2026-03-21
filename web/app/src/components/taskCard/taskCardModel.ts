/**
 * Pure helpers shared by TaskCard, footer, and any extracted picker subcomponents.
 * Prefer importing from here over duplicating maps/ratios or adding a parallel “model” module.
 */
import type {Area} from '../../types';

export function checklistCompletionRatio(completed: number, total: number): number {
  if (!total) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

export function areaNameByIdMap(areas: Area[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of areas) {
    map[a.id] = a.name;
  }
  return map;
}
