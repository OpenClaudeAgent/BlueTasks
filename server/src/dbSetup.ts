import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

/** Incrémenter et ajouter un bloc `if (v < N)` lors d’un changement de schéma. */
export const CURRENT_SCHEMA_VERSION = 1;

export function getUserVersion(database: Database.Database): number {
  const raw = database.pragma('user_version', {simple: true});
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function migrateTasksTable(database: Database.Database) {
  const columns = database.prepare('PRAGMA table_info(tasks)').all() as {name: string}[];
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('priority')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'`);
  }
  if (!names.has('estimate_minutes')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN estimate_minutes INTEGER`);
  }
  if (!names.has('pinned')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`);
  }
  if (!names.has('time_spent_seconds')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN time_spent_seconds INTEGER NOT NULL DEFAULT 0`);
  }
  if (!names.has('timer_started_at')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN timer_started_at TEXT`);
  }
  if (!names.has('recurrence')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN recurrence TEXT`);
  }
  if (!names.has('area_id')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN area_id TEXT`);
  }
}

export function migrateAreasTable(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  const areaColumns = database.prepare('PRAGMA table_info(areas)').all() as {name: string}[];
  if (!areaColumns.some((c) => c.name === 'icon')) {
    database.exec(`ALTER TABLE areas ADD COLUMN icon TEXT NOT NULL DEFAULT 'folder'`);
  }
}

function migrationV1(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      task_date TEXT,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL DEFAULT '',
      checklist_total INTEGER NOT NULL DEFAULT 0,
      checklist_completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'normal',
      estimate_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  migrateTasksTable(database);
  migrateAreasTable(database);
}

/**
 * Applique les migrations manquantes selon `PRAGMA user_version`.
 * Idempotent pour une version donnée.
 */
export function runMigrations(database: Database.Database) {
  const v = getUserVersion(database);
  if (v < 1) {
    migrationV1(database);
    database.pragma('user_version = 1');
  }
  const after = getUserVersion(database);
  if (after !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Database user_version is ${after} but this server expects ${CURRENT_SCHEMA_VERSION}. Upgrade the app or migrate manually.`,
    );
  }
}

export function openAndMigrateDatabase(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), {recursive: true});
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  runMigrations(db);
  return db;
}

/** Supprime les fichiers WAL/SHM associés (après fermeture de la connexion) pour éviter un mélange avec un nouveau fichier principal. */
export function removeSqliteSidecars(dbPath: string): void {
  for (const suffix of ['-wal', '-shm']) {
    try {
      fs.unlinkSync(dbPath + suffix);
    } catch {
      /* ignore */
    }
  }
}

/** Vérifie que les tables BlueTasks existent (après migrations). */
export function assertBluetasksDatabase(database: Database.Database): void {
  const rows = database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('tasks', 'areas')`)
    .all() as {name: string}[];
  const names = new Set(rows.map((r) => r.name));
  if (!names.has('tasks') || !names.has('areas')) {
    throw new Error('Not a BlueTasks database (missing tasks or areas table)');
  }
}
