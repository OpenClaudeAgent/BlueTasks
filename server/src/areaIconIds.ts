import fs from 'node:fs';
import path from 'node:path';
import {getAppRoot} from './appPaths.js';

const idsPath = path.join(getAppRoot(), 'server', 'data', 'area-icon-ids.json');

const raw = fs.readFileSync(idsPath, 'utf8');
const parsed = JSON.parse(raw) as unknown;
if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
  throw new Error(`Invalid server/data/area-icon-ids.json at ${idsPath}`);
}

export const AREA_ICON_IDS = parsed as readonly string[];
export const ALLOWED_AREA_ICONS = new Set<string>(AREA_ICON_IDS);

export function normalizeAreaIcon(value: unknown): string {
  if (typeof value !== 'string') {
    return 'folder';
  }
  return ALLOWED_AREA_ICONS.has(value) ? value : 'folder';
}
