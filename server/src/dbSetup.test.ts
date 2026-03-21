import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import Database from 'better-sqlite3';
import {
  CURRENT_SCHEMA_VERSION,
  getUserVersion,
  openAndMigrateDatabase,
  runMigrations,
} from './dbSetup.js';

describe('dbSetup', () => {
  it('openAndMigrateDatabase(:memory:) sets user_version to the current schema', () => {
    const db = openAndMigrateDatabase(':memory:');
    try {
      expect(getUserVersion(db)).toBe(CURRENT_SCHEMA_VERSION);
    } finally {
      db.close();
    }
  });

  it('runMigrations adds missing columns on a minimal tasks table', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          task_date TEXT,
          content_json TEXT NOT NULL,
          content_text TEXT NOT NULL DEFAULT '',
          checklist_total INTEGER NOT NULL DEFAULT 0,
          checklist_completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      expect(getUserVersion(db)).toBe(0);
      runMigrations(db);
      const cols = db.prepare('PRAGMA table_info(tasks)').all() as {name: string}[];
      expect(cols.some((c) => c.name === 'priority')).toBe(true);
      expect(cols.some((c) => c.name === 'area_id')).toBe(true);
      expect(getUserVersion(db)).toBe(CURRENT_SCHEMA_VERSION);
    } finally {
      db.close();
    }
  });

  it('openAndMigrateDatabase persists user_version on a temp file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-db-'));
    const dbPath = path.join(dir, 'test.sqlite');
    try {
      const db1 = openAndMigrateDatabase(dbPath);
      db1.close();
      const check = new Database(dbPath);
      try {
        expect(getUserVersion(check)).toBe(CURRENT_SCHEMA_VERSION);
      } finally {
        check.close();
      }
      const db2 = openAndMigrateDatabase(dbPath);
      try {
        expect(getUserVersion(db2)).toBe(CURRENT_SCHEMA_VERSION);
        runMigrations(db2);
        expect(getUserVersion(db2)).toBe(CURRENT_SCHEMA_VERSION);
      } finally {
        db2.close();
      }
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('rejects a database whose user_version is newer than supported', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE tasks (
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
      db.pragma('user_version = 99');
      expect(() => runMigrations(db)).toThrow(/user_version is 99/);
    } finally {
      db.close();
    }
  });
});
