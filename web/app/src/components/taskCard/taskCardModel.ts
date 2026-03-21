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
