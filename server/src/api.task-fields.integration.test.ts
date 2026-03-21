import {afterAll, describe, expect, it} from 'vitest';
import request from 'supertest';
import {createApp} from './createApp.js';
import {openAndMigrateDatabase} from './dbSetup.js';
import {emptyEditorState} from './taskSanitize.js';

const dbCtx = {current: openAndMigrateDatabase(':memory:')};
const app = createApp(dbCtx, {});

afterAll(() => {
  dbCtx.current.close();
});

async function createTask(title: string): Promise<Record<string, unknown>> {
  const res = await request(app).post('/api/tasks').send({title});
  expect(res.status).toBe(201);
  return res.body as Record<string, unknown>;
}

describe.sequential('API: task fields (shared in-memory DB)', () => {
describe('API: task field persistence', () => {
  it('PUT /api/tasks/:id persists priority high', async () => {
    const row = await createTask('prio');
    const updated = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({...row, priority: 'high'});
    expect(updated.status).toBe(200);
    expect(updated.body.priority).toBe('high');
  });

  it('PUT /api/tasks/:id persists pinned true and false', async () => {
    const row = await createTask('pin');
    const on = await request(app).put(`/api/tasks/${row.id}`).send({...row, pinned: true});
    expect(on.status).toBe(200);
    expect(on.body.pinned).toBe(true);

    const off = await request(app).put(`/api/tasks/${on.body.id}`).send({...on.body, pinned: false});
    expect(off.status).toBe(200);
    expect(off.body.pinned).toBe(false);
  });

  it('PUT /api/tasks/:id persists estimateMinutes preset and null', async () => {
    const row = await createTask('est');
    const withEst = await request(app).put(`/api/tasks/${row.id}`).send({...row, estimateMinutes: 90});
    expect(withEst.status).toBe(200);
    expect(withEst.body.estimateMinutes).toBe(90);

    const cleared = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({...withEst.body, estimateMinutes: null});
    expect(cleared.status).toBe(200);
    expect(cleared.body.estimateMinutes).toBeNull();
  });

  it('PUT /api/tasks/:id persists recurrence weekly then null', async () => {
    const row = await createTask('rec');
    const withR = await request(app).put(`/api/tasks/${row.id}`).send({...row, recurrence: 'weekly'});
    expect(withR.status).toBe(200);
    expect(withR.body.recurrence).toBe('weekly');

    const cleared = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({...withR.body, recurrence: null});
    expect(cleared.status).toBe(200);
    expect(cleared.body.recurrence).toBeNull();
  });

  it('PUT /api/tasks/:id persists timerStartedAt ISO string and null', async () => {
    const row = await createTask('timer');
    const iso = '2025-06-01T12:00:00.000Z';
    const started = await request(app).put(`/api/tasks/${row.id}`).send({...row, timerStartedAt: iso});
    expect(started.status).toBe(200);
    expect(started.body.timerStartedAt).toBe(new Date(iso).toISOString());

    const cleared = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({...started.body, timerStartedAt: null});
    expect(cleared.status).toBe(200);
    expect(cleared.body.timerStartedAt).toBeNull();
  });

  it('PUT /api/tasks/:id persists taskDate YYYY-MM-DD and null', async () => {
    const row = await createTask('date');
    const dated = await request(app).put(`/api/tasks/${row.id}`).send({...row, taskDate: '2025-08-15'});
    expect(dated.status).toBe(200);
    expect(dated.body.taskDate).toBe('2025-08-15');

    const cleared = await request(app).put(`/api/tasks/${row.id}`).send({...dated.body, taskDate: null});
    expect(cleared.status).toBe(200);
    expect(cleared.body.taskDate).toBeNull();
  });

  it('PUT /api/tasks/:id persists contentJson / contentText / checklist counters', async () => {
    const row = await createTask('content');
    const json = emptyEditorState();
    const updated = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({
        ...row,
        contentJson: json,
        contentText: 'hello body',
        checklistTotal: 4,
        checklistCompleted: 2,
      });
    expect(updated.status).toBe(200);
    expect(updated.body.contentText).toBe('hello body');
    expect(updated.body.checklistTotal).toBe(4);
    expect(updated.body.checklistCompleted).toBe(2);
  });

  it('PUT coerces invalid priority and recurrence via sanitize (no 400)', async () => {
    const row = await createTask('coerce');
    const res = await request(app)
      .put(`/api/tasks/${row.id}`)
      .send({...row, priority: 'nope', recurrence: 'hourly'});
    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('normal');
    expect(res.body.recurrence).toBeNull();
  });
});

describe('API: GET /api/tasks ordering', () => {
  it('lists pending tasks before completed (SQL order)', async () => {
    const a = await createTask('pending-one');
    await createTask('pending-two');
    await request(app).put(`/api/tasks/${a.id}`).send({...a, status: 'completed'});

    const list = await request(app).get('/api/tasks');
    expect(list.status).toBe(200);
    const titles = (list.body as {title: string; status: string}[]).map((t) => t.title);
    const idxP = titles.indexOf('pending-two');
    const idxC = titles.indexOf('pending-one');
    expect(idxP).not.toBe(-1);
    expect(idxC).not.toBe(-1);
    expect(idxP).toBeLessThan(idxC);
  });
});
});
