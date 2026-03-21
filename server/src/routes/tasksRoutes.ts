import type Database from 'better-sqlite3';
import {Router} from 'express';
import type {TaskPayload, TaskRow} from '../taskSanitize.js';
import {
  normalizePinnedInput,
  normalizeRecurrence,
  sanitizePayload,
} from '../taskSanitize.js';

export function createTasksRouter(getDb: () => Database.Database): Router {
  const r = Router();

  r.get('/', (_req, res) => {
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

  r.post('/', (req, res) => {
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

  r.put('/:id', (req, res) => {
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

  r.delete('/:id', (req, res) => {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  return r;
}
