import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * App root: repo root in dev (`server/dist` → `../..`), Docker image, or desktop bundle (`BLUETASKS_HOME`).
 * The Docker/desktop CJS bundle cannot use `import.meta.url` for this.
 */
export function getAppRoot(): string {
  const env = process.env.BLUETASKS_HOME?.trim();
  if (env) {
    return path.resolve(env);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

/**
 * Directory for `bluetasks.sqlite` (WAL/SHM alongside). Defaults to `<appRoot>/.data`.
 * For a macOS .app bundle, set a writable path (e.g. Application Support) via `BLUETASKS_DATA_DIR`.
 */
export function getDataDir(): string {
  const env = process.env.BLUETASKS_DATA_DIR?.trim();
  if (env) {
    return path.resolve(env);
  }
  return path.join(getAppRoot(), '.data');
}
