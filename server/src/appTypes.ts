import type Database from 'better-sqlite3';

export type DatabaseContext = {
  current: Database.Database;
};

export type CreateAppOptions = {
  /** Vite build output directory; if omitted or missing on disk, no static / SPA fallback. */
  staticDir?: string | null;
  /** Persistent SQLite file path. Required for `POST /api/import/database`. */
  dbFilePath?: string | null;
};
