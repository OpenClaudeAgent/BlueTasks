import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Racine du dépôt (dev : `server/dist` → `../..`) ou image Docker (`BLUETASKS_HOME=/app`).
 * Le bundle CJS Docker ne peut pas s’appuyer sur `import.meta.url` pour ce calcul.
 */
export function getAppRoot(): string {
  const env = process.env.BLUETASKS_HOME?.trim();
  if (env) {
    return path.resolve(env);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}
