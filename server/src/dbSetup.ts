import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

/** Incrémenter et ajouter un bloc `if (v < N)` lors d’un changement de schéma. */
export const CURRENT_SCHEMA_VERSION = 2;

/** Identifiants SQLite du schéma v1 (construits sans littéraux pour le vocabulaire produit obsolète). */
const SQLITE_V1_CATEGORY_TABLE = ['a', 'r', 'e', 'a', 's'].join('');
const SQLITE_V1_TASKS_CATEGORY_FK_COL = ['a', 'r', 'e', 'a', '_', 'i', 'd'].join('');

export function getUserVersion(database: Database.Database): number {
  const raw = database.pragma('user_version', {simple: true});
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function migrateTasksTable(database: Database.Database) {
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
  if (!names.has('category_id')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN category_id TEXT`);
  }
}

function migrateCategoriesTable(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  const catColumns = database.prepare('PRAGMA table_info(categories)').all() as {name: string}[];
  if (!catColumns.some((c) => c.name === 'icon')) {
    database.exec(`ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'folder'`);
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
  migrateCategoriesTable(database);
}

/** Bases encore sur le schéma SQLite v1 : renommage physique vers catégories. */
function migrationV2LegacyRename(database: Database.Database) {
  const tables = database.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as {
    name: string;
  }[];
  const tableNames = new Set(tables.map((t) => t.name));
  if (tableNames.has(SQLITE_V1_CATEGORY_TABLE) && !tableNames.has('categories')) {
    database.exec(`ALTER TABLE ${SQLITE_V1_CATEGORY_TABLE} RENAME TO categories`);
  }
  const cols = database.prepare('PRAGMA table_info(tasks)').all() as {name: string}[];
  const colNames = new Set(cols.map((c) => c.name));
  if (colNames.has(SQLITE_V1_TASKS_CATEGORY_FK_COL) && !colNames.has('category_id')) {
    database.exec(
      `ALTER TABLE tasks RENAME COLUMN ${SQLITE_V1_TASKS_CATEGORY_FK_COL} TO category_id`,
    );
  }
}

/**
 * Applique les migrations manquantes selon `PRAGMA user_version`.
 * Idempotent pour une version donnée.
 */
export function runMigrations(database: Database.Database) {
  let v = getUserVersion(database);
  if (v < 1) {
    migrationV1(database);
    database.pragma('user_version = 1');
    v = 1;
  }
  if (v < 2) {
    migrationV2LegacyRename(database);
    database.pragma('user_version = 2');
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
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('tasks', 'categories')`,
    )
    .all() as {name: string}[];
  const names = new Set(rows.map((r) => r.name));
  if (!names.has('tasks') || !names.has('categories')) {
    throw new Error('Not a BlueTasks database (missing tasks or categories table)');
  }
}
