import {beforeAll, describe, expect, it} from 'vitest';
import {openAndMigrateDatabase} from './dbSetup.js';
import {
  emptyEditorState,
  isDateKey,
  normalizeCategoryId,
  normalizePriority,
  normalizeRecurrence,
  sanitizePayload,
} from './taskSanitize.js';

describe('taskSanitize', () => {
  const db = openAndMigrateDatabase(':memory:');

  beforeAll(() => {
    db.prepare(
      'INSERT INTO categories (id, name, icon, sort_index, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('cat-1', 'Zone A', 'folder', 0, new Date().toISOString());
  });

  it('sanitizePayload drops unknown categoryId values', () => {
    const p = sanitizePayload({categoryId: 'unknown', title: 'T'}, db);
    expect(p.categoryId).toBeNull();
  });

  it('sanitizePayload keeps an existing category id', () => {
    const p = sanitizePayload({categoryId: 'cat-1', title: 'T'}, db);
    expect(p.categoryId).toBe('cat-1');
  });

  it('sanitizePayload caps checklistCompleted at total', () => {
    const p = sanitizePayload({checklistTotal: 2, checklistCompleted: 99, title: ''}, db);
    expect(p.checklistCompleted).toBe(2);
  });

  it('sanitizePayload caps estimateMinutes', () => {
    const p = sanitizePayload({estimateMinutes: 99999, title: ''}, db);
    expect(p.estimateMinutes).toBe(24 * 60);
  });

  it('sanitizePayload drops invalid timerStartedAt', () => {
    const p = sanitizePayload({timerStartedAt: 'not-a-date', title: 'x'}, db);
    expect(p.timerStartedAt).toBeNull();
  });

  it('sanitizePayload ignores non-finite timeSpentSeconds', () => {
    const p = sanitizePayload({timeSpentSeconds: Number.NaN, title: 'x'}, db);
    expect(p.timeSpentSeconds).toBe(0);
  });

  it('normalizeCategoryId rejects non-string', () => {
    expect(normalizeCategoryId(123, db)).toBeNull();
  });

  it('normalizePriority', () => {
    expect(normalizePriority('high')).toBe('high');
    expect(normalizePriority('weird')).toBe('normal');
  });

  it('normalizeRecurrence', () => {
    expect(normalizeRecurrence('weekly')).toBe('weekly');
    expect(normalizeRecurrence('nope')).toBeNull();
  });

  it('isDateKey', () => {
    expect(isDateKey('2024-06-01')).toBe(true);
    expect(isDateKey('24-06-01')).toBe(false);
  });

  it('emptyEditorState is minimal Lexical JSON', () => {
    const root = JSON.parse(emptyEditorState()).root;
    expect(root.type).toBe('root');
    expect(Array.isArray(root.children)).toBe(true);
  });
});
