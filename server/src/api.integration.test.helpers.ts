import {expect} from 'vitest';

/** Shape returned by GET /api/tasks after server mapping (stable contract for clients). */
export function expectApiTaskRow(t: unknown): void {
  const row = t as Record<string, unknown>;

  expect(typeof row.id).toBe('string');
  expect((row.id as string).length).toBeGreaterThan(0);
  expect(typeof row.title).toBe('string');
  expect(['pending', 'completed']).toContain(row.status);

  const td = row.taskDate;
  expect(td === null || (typeof td === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(td))).toBe(true);

  expect(typeof row.contentJson).toBe('string');
  expect((row.contentJson as string).length).toBeGreaterThan(0);
  expect(typeof row.contentText).toBe('string');
  expect(typeof row.checklistTotal).toBe('number');
  expect(typeof row.checklistCompleted).toBe('number');
  expect(['low', 'normal', 'high']).toContain(row.priority);

  const em = row.estimateMinutes;
  expect(em === null || (typeof em === 'number' && Number.isFinite(em))).toBe(true);

  expect(typeof row.pinned).toBe('boolean');
  expect(typeof row.timeSpentSeconds).toBe('number');

  const ts = row.timerStartedAt;
  expect(ts === null || typeof ts === 'string').toBe(true);

  const rec = row.recurrence;
  expect(
    rec === null ||
      rec === 'daily' ||
      rec === 'weekly' ||
      rec === 'biweekly' ||
      rec === 'monthly' ||
      rec === 'yearly',
  ).toBe(true);

  const aid = row.areaId;
  expect(aid === null || typeof aid === 'string').toBe(true);

  expect(typeof row.createdAt).toBe('string');
  expect(typeof row.updatedAt).toBe('string');
  expect(Number.isNaN(Date.parse(row.createdAt as string))).toBe(false);
  expect(Number.isNaN(Date.parse(row.updatedAt as string))).toBe(false);
}
