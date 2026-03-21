import {beforeAll, describe, expect, it} from 'vitest';
import {openAndMigrateDatabase} from './dbSetup.js';
import {
  emptyEditorState,
  isDateKey,
  normalizePriority,
  normalizeRecurrence,
  sanitizePayload,
} from './taskSanitize.js';

describe('taskSanitize', () => {
  const db = openAndMigrateDatabase(':memory:');

  beforeAll(() => {
    db.prepare(
      'INSERT INTO areas (id, name, icon, sort_index, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('area-1', 'Zone A', 'folder', 0, new Date().toISOString());
  });

  it('sanitizePayload ignore les areaId inconnues', () => {
    const p = sanitizePayload({areaId: 'unknown', title: 'T'}, db);
    expect(p.areaId).toBeNull();
  });

  it('sanitizePayload conserve une zone existante', () => {
    const p = sanitizePayload({areaId: 'area-1', title: 'T'}, db);
    expect(p.areaId).toBe('area-1');
  });

  it('sanitizePayload borne checklistCompleted au total', () => {
    const p = sanitizePayload({checklistTotal: 2, checklistCompleted: 99, title: ''}, db);
    expect(p.checklistCompleted).toBe(2);
  });

  it('sanitizePayload borne estimateMinutes', () => {
    const p = sanitizePayload({estimateMinutes: 99999, title: ''}, db);
    expect(p.estimateMinutes).toBe(24 * 60);
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

  it('emptyEditorState est du JSON Lexical minimal', () => {
    const root = JSON.parse(emptyEditorState()).root;
    expect(root.type).toBe('root');
    expect(Array.isArray(root.children)).toBe(true);
  });
});
