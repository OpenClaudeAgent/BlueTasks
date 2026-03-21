import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Application, NextFunction, Request, Response} from 'express';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import type Database from 'better-sqlite3';
import {normalizeAreaIcon} from './areaIconIds.js';
import type {TaskPayload, TaskRow} from './taskSanitize.js';
import {
  normalizePinnedInput,
  normalizeRecurrence,
  sanitizePayload,
} from './taskSanitize.js';
import {
  assertBluetasksDatabase,
  openAndMigrateDatabase,
  removeSqliteSidecars,
} from './dbSetup.js';

export type DatabaseContext = {
  current: Database.Database;
};

export type CreateAppOptions = {
  /** Dossier du build Vite ; si absent ou inexistant, pas de static / SPA fallback */
  staticDir?: string | null;
  /** Fichier SQLite persistant. Requis pour `POST /api/import/database`. */
  dbFilePath?: string | null;
};

const uploadImport = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, _file, cb) => {
      cb(null, `bluetasks-import-${randomUUID()}.sqlite`);
    },
  }),
  limits: {fileSize: 80 * 1024 * 1024},
});

function handleImportUpload(req: Request, res: Response, next: NextFunction): void {
  uploadImport.single('database')(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large (max 80 MB)'
          : err instanceof Error
            ? err.message
            : 'Upload failed';
      res.status(400).json({message});
      return;
    }
    next();
  });
}

export function createApp(dbCtx: DatabaseContext, options: CreateAppOptions = {}): Application {
  const getDb = () => dbCtx.current;
  const app = express();
  app.use(cors());
  app.use(express.json({limit: '2mb'}));

  app.get('/api/tasks', (_req, res) => {
    const rows = getDb()
      .prepare(
        `
      SELECT
        id,
        title,
        status,
        task_date as taskDate,
        content_json as contentJson,
        content_text as contentText,
        checklist_total as checklistTotal,
        checklist_completed as checklistCompleted,
        priority,
        estimate_minutes as estimateMinutes,
        pinned,
        time_spent_seconds as timeSpentSeconds,
        timer_started_at as timerStartedAt,
        recurrence,
        area_id as areaId,
        created_at as createdAt,
        updated_at as updatedAt
      FROM tasks
      ORDER BY
        CASE WHEN status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN task_date IS NULL THEN 1 ELSE 0 END,
        task_date ASC,
        created_at ASC
      `,
      )
      .all() as Record<string, unknown>[];

    const tasks = rows.map((row) => ({
      ...row,
      priority: row.priority === 'low' || row.priority === 'high' ? row.priority : 'normal',
      estimateMinutes: row.estimateMinutes ?? null,
      pinned: normalizePinnedInput(row.pinned),
      timeSpentSeconds: Number(row.timeSpentSeconds) || 0,
      timerStartedAt: typeof row.timerStartedAt === 'string' && row.timerStartedAt ? row.timerStartedAt : null,
      recurrence: normalizeRecurrence(row.recurrence),
      areaId: typeof row.areaId === 'string' && row.areaId ? row.areaId : null,
    }));

    res.json(tasks);
  });

  app.get('/api/areas', (_req, res) => {
    const rows = getDb()
      .prepare(
        `
      SELECT id, name, icon, sort_index as sortIndex, created_at as createdAt
      FROM areas
      ORDER BY sort_index ASC, created_at ASC
      `,
      )
      .all() as Record<string, unknown>[];

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        icon: normalizeAreaIcon(row.icon),
        sortIndex: Number(row.sortIndex) || 0,
        createdAt: row.createdAt,
      })),
    );
  });

  app.post('/api/areas', (req, res) => {
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

  app.put('/api/areas/:id', (req, res) => {
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

    res.json({
      id: row.id,
      name: row.name,
      icon: normalizeAreaIcon(row.icon),
      sortIndex: Number(row.sortIndex) || 0,
      createdAt: row.createdAt,
    });
  });

  app.delete('/api/areas/:id', (req, res) => {
    const existing = getDb().prepare('SELECT id FROM areas WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({message: 'Area not found'});
      return;
    }

    getDb().prepare('UPDATE tasks SET area_id = NULL WHERE area_id = ?').run(req.params.id);
    getDb().prepare('DELETE FROM areas WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  app.post('/api/tasks', (req, res) => {
    const now = new Date().toISOString();
    const payload = sanitizePayload(req.body as Partial<TaskPayload>, getDb());
    const row: TaskRow = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    getDb()
      .prepare(
        `
    INSERT INTO tasks (
      id,
      title,
      status,
      task_date,
      content_json,
      content_text,
      checklist_total,
      checklist_completed,
      priority,
      estimate_minutes,
      pinned,
      time_spent_seconds,
      timer_started_at,
      recurrence,
      area_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        row.id,
        row.title,
        row.status,
        row.taskDate,
        row.contentJson,
        row.contentText,
        row.checklistTotal,
        row.checklistCompleted,
        row.priority,
        row.estimateMinutes,
        row.pinned ? 1 : 0,
        row.timeSpentSeconds,
        row.timerStartedAt,
        row.recurrence,
        row.areaId,
        row.createdAt,
        row.updatedAt,
      );

    res.status(201).json(row);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const existing = getDb()
      .prepare('SELECT created_at as createdAt FROM tasks WHERE id = ?')
      .get(req.params.id) as {createdAt: string} | undefined;

    if (!existing) {
      res.status(404).json({message: 'Task not found'});
      return;
    }

    const payload = sanitizePayload(
      {
        ...(req.body as Partial<TaskPayload>),
        id: req.params.id,
      },
      getDb(),
    );

    const updatedAt = new Date().toISOString();

    getDb()
      .prepare(
        `
    UPDATE tasks
    SET
      title = ?,
      status = ?,
      task_date = ?,
      content_json = ?,
      content_text = ?,
      checklist_total = ?,
      checklist_completed = ?,
      priority = ?,
      estimate_minutes = ?,
      pinned = ?,
      time_spent_seconds = ?,
      timer_started_at = ?,
      recurrence = ?,
      area_id = ?,
      updated_at = ?
    WHERE id = ?
    `,
      )
      .run(
        payload.title,
        payload.status,
        payload.taskDate,
        payload.contentJson,
        payload.contentText,
        payload.checklistTotal,
        payload.checklistCompleted,
        payload.priority,
        payload.estimateMinutes,
        payload.pinned ? 1 : 0,
        payload.timeSpentSeconds,
        payload.timerStartedAt,
        payload.recurrence,
        payload.areaId,
        updatedAt,
        payload.id,
      );

    res.json({
      ...payload,
      createdAt: existing.createdAt,
      updatedAt,
    });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  app.post(
    '/api/import/database',
    (req, res, next) => {
      if (!options.dbFilePath) {
        res.status(501).json({message: 'Database import requires a file-backed database'});
        return;
      }
      next();
    },
    handleImportUpload,
    (req, res) => {
      const dbPath = options.dbFilePath!;
      const file = req.file;
      if (!file?.path) {
        res.status(400).json({message: 'No file uploaded (use form field "database")'});
        return;
      }
      const uploadedPath = file.path;
      let trial: Database.Database | undefined;
      try {
        trial = openAndMigrateDatabase(uploadedPath);
        assertBluetasksDatabase(trial);
        trial.close();
        trial = undefined;
      } catch {
        try {
          trial?.close();
        } catch {
          /* ignore */
        }
        try {
          fs.unlinkSync(uploadedPath);
        } catch {
          /* ignore */
        }
        res.status(400).json({message: 'Invalid or incompatible SQLite file'});
        return;
      }

      try {
        getDb().close();
      } catch (closeErr) {
        console.error('[import] close previous db', closeErr);
      }

      removeSqliteSidecars(dbPath);
      const staging = `${dbPath}.import-${randomUUID()}`;
      try {
        fs.copyFileSync(uploadedPath, staging);
        fs.renameSync(staging, dbPath);
      } catch (copyErr) {
        console.error('[import] replace file', copyErr);
        try {
          fs.unlinkSync(staging);
        } catch {
          /* ignore */
        }
        try {
          fs.unlinkSync(uploadedPath);
        } catch {
          /* ignore */
        }
        try {
          dbCtx.current = openAndMigrateDatabase(dbPath);
        } catch (reopenErr) {
          console.error('[import] reopen after failure', reopenErr);
        }
        res.status(500).json({message: 'Failed to replace database file'});
        return;
      }
      try {
        fs.unlinkSync(uploadedPath);
      } catch {
        /* ignore */
      }

      try {
        dbCtx.current = openAndMigrateDatabase(dbPath);
      } catch (reopenErr) {
        console.error('[import] reopen', reopenErr);
        res.status(500).json({message: 'Failed to open imported database'});
        return;
      }

      res.status(204).send();
    },
  );

  app.get('/api/export/database', (_req, res) => {
    const tmpPath = path.join(os.tmpdir(), `bluetasks-export-${randomUUID()}.sqlite`);
    try {
      const escaped = tmpPath.replace(/'/g, "''");
      getDb().exec(`VACUUM INTO '${escaped}'`);
    } catch (error) {
      console.error('[export]', error);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      res.status(500).type('text/plain').send('Database export failed');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="bluetasks-${stamp}.sqlite"`);

    const stream = fs.createReadStream(tmpPath);
    stream.on('error', (err) => {
      console.error('[export stream]', err);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      if (!res.headersSent) {
        res.status(500).type('text/plain').send('Database export failed');
      } else {
        res.destroy();
      }
    });
    res.on('close', () => {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    });
    stream.pipe(res);
  });

  const staticDir = options.staticDir;
  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  return app;
}
