import fs from 'node:fs';
import path from 'node:path';
import {getAppRoot} from './appPaths.js';

const idsPath = path.join(getAppRoot(), 'server', 'data', 'category-icon-ids.json');

const raw = fs.readFileSync(idsPath, 'utf8');
const parsed = JSON.parse(raw) as unknown;
if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
  throw new Error(`Invalid server/data/category-icon-ids.json at ${idsPath}`);
}

export const CATEGORY_ICON_IDS = parsed as readonly string[];
const ALLOWED_CATEGORY_ICONS = new Set<string>(CATEGORY_ICON_IDS);

export function normalizeCategoryIcon(value: unknown): string {
  if (typeof value !== 'string') {
    return 'folder';
  }
  return ALLOWED_CATEGORY_ICONS.has(value) ? value : 'folder';
}
