import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {Router} from 'express';
import {normalizeAreaIcon} from '../areaIconIds.js';

function areaRowToJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    icon: normalizeAreaIcon(row.icon),
    sortIndex: Number(row.sortIndex) || 0,
    createdAt: row.createdAt,
  };
}

export function createAreasRouter(getDb: () => Database.Database): Router {
  const r = Router();

  r.get('/', (_req, res) => {
    const rows = getDb()
      .prepare(
        `
      SELECT id, name, icon, sort_index as sortIndex, created_at as createdAt
      FROM areas
      ORDER BY sort_index ASC, created_at ASC
      `,
      )
      .all() as Record<string, unknown>[];

    res.json(rows.map((row) => areaRowToJson(row)));
  });

  r.post('/', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      res.status(400).json({message: 'Name required'});
      return;
    }

    const icon = normalizeAreaIcon(req.body?.icon);
    const id = randomUUID();
    const now = new Date().toISOString();
    const maxRow = getDb().prepare('SELECT COALESCE(MAX(sort_index), -1) as m FROM areas').get() as {m: number};
    const sortIndex = maxRow.m + 1;

    getDb()
      .prepare(
        `
    INSERT INTO areas (id, name, icon, sort_index, created_at)
    VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(id, name, icon, sortIndex, now);

    res.status(201).json({id, name, icon, sortIndex, createdAt: now});
  });

  r.put('/:id', (req, res) => {
    const existing = getDb()
      .prepare('SELECT id, name, icon FROM areas WHERE id = ?')
      .get(req.params.id) as {id: string; name: string; icon: string} | undefined;
    if (!existing) {
      res.status(404).json({message: 'Area not found'});
      return;
    }

    const nameRaw = req.body?.name;
    if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
      res.status(400).json({message: 'Name required'});
      return;
    }

    const name = nameRaw.trim();
    const icon =
      req.body != null && Object.prototype.hasOwnProperty.call(req.body, 'icon')
        ? normalizeAreaIcon(req.body.icon)
        : normalizeAreaIcon(existing.icon);

    getDb().prepare('UPDATE areas SET name = ?, icon = ? WHERE id = ?').run(name, icon, req.params.id);
    const row = getDb()
      .prepare('SELECT id, name, icon, sort_index as sortIndex, created_at as createdAt FROM areas WHERE id = ?')
      .get(req.params.id) as Record<string, unknown>;

    res.json(areaRowToJson(row));
  });

  r.delete('/:id', (req, res) => {
    const existing = getDb().prepare('SELECT id FROM areas WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({message: 'Area not found'});
      return;
    }

    getDb().prepare('UPDATE tasks SET area_id = NULL WHERE area_id = ?').run(req.params.id);
    getDb().prepare('DELETE FROM areas WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  return r;
}
