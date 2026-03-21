import fs from 'node:fs';
import type {IncomingMessage} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {afterAll, describe, expect, it} from 'vitest';
import request from 'supertest';
import {expectApiTaskRow} from './api.integration.test.helpers.js';
import {createApp} from './createApp.js';
import {openAndMigrateDatabase} from './dbSetup.js';

const dbCtx = {current: openAndMigrateDatabase(':memory:')};
const app = createApp(dbCtx, {});

afterAll(() => {
  dbCtx.current.close();
});

describe('API HTTP', () => {
  it('GET /api/tasks returns a JSON array whose elements match the public task contract', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    for (const row of res.body) {
      expectApiTaskRow(row);
    }
  });

  it('POST /api/areas then POST /api/tasks with areaId returns persisted row in GET list', async () => {
    const area = await request(app).post('/api/areas').send({name: 'Project'});
    expect(area.status).toBe(201);
    expect(area.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Project',
        icon: 'folder',
        sortIndex: expect.any(Number),
        createdAt: expect.any(String),
      }),
    );
    const areaId = area.body.id as string;

    const task = await request(app).post('/api/tasks').send({
      title: 'Linked task',
      areaId,
    });
    expect(task.status).toBe(201);
    expectApiTaskRow(task.body);
    expect(task.body.title).toBe('Linked task');
    expect(task.body.areaId).toBe(areaId);
    expect(task.body.status).toBe('pending');

    const list = await request(app).get('/api/tasks');
    expect(list.status).toBe(200);
    const found = list.body.find((t: {id: string}) => t.id === task.body.id);
    expect(found).toBeDefined();
    expectApiTaskRow(found);
    expect(found.title).toBe('Linked task');
    expect(found.areaId).toBe(areaId);
  });

  it('PUT /api/tasks/:id updates title and preserves createdAt', async () => {
    const created = await request(app).post('/api/tasks').send({title: 'A'});
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const createdAt = created.body.createdAt as string;

    const updated = await request(app).put(`/api/tasks/${id}`).send({
      ...created.body,
      title: 'B',
    });
    expect(updated.status).toBe(200);
    expectApiTaskRow(updated.body);
    expect(updated.body.title).toBe('B');
    expect(updated.body.id).toBe(id);
    expect(updated.body.createdAt).toBe(createdAt);
    expect((updated.body.updatedAt as string) >= createdAt).toBe(true);
  });

  it('DELETE /api/tasks/:id returns 204 and removes the task from the list', async () => {
    const created = await request(app).post('/api/tasks').send({title: 'To delete'});
    const id = created.body.id as string;
    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);
    expect(del.text).toBe('');

    const list = await request(app).get('/api/tasks');
    expect(list.body.find((t: {id: string}) => t.id === id)).toBeUndefined();
  });

  it('GET /api/export/database returns a SQLite attachment with dated filename', async () => {
    await request(app).post('/api/tasks').send({title: 'For export'});
    const res = await request(app)
      .get('/api/export/database')
      .buffer(true)
      .parse((res: IncomingMessage, fn) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on('end', () => fn(null, Buffer.concat(chunks)));
        res.on('error', fn);
      });
    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toContain('sqlite');
    const cd = String(res.headers['content-disposition']);
    expect(cd).toMatch(/^attachment; filename="bluetasks-\d{4}-\d{2}-\d{2}\.sqlite"$/);
    const buf = res.body as Buffer;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 16).toString('hex')).toBe('53514c69746520666f726d6174203300'); // SQLite format 3\0
  });

  it('GET /api/export/database succeeds for empty DB and returns valid SQLite header', async () => {
    const emptyCtx = {current: openAndMigrateDatabase(':memory:')};
    const appEmpty = createApp(emptyCtx, {});
    try {
      const res = await request(appEmpty)
        .get('/api/export/database')
        .buffer(true)
        .parse((res: IncomingMessage, fn) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          res.on('end', () => fn(null, Buffer.concat(chunks)));
          res.on('error', fn);
        });
      expect(res.status).toBe(200);
      expect(String(res.headers['content-type'])).toContain('sqlite');
      const buf = res.body as Buffer;
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.subarray(0, 16).toString('hex')).toBe('53514c69746520666f726d6174203300');
    } finally {
      emptyCtx.current.close();
    }
  });

  it('POST /api/import/database returns 501 when server has no file-backed DB path', async () => {
    const res = await request(app).post('/api/import/database');
    expect(res.status).toBe(501);
    expect(res.body).toEqual({
      message: 'Database import requires a file-backed database',
    });
  });

  it('POST /api/import/database restores a previously exported database', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-import-'));
    const dbPath = path.join(dir, 'app.sqlite');
    const ctx = {current: openAndMigrateDatabase(dbPath)};
    const fileApp = createApp(ctx, {dbFilePath: dbPath});
    try {
      await request(fileApp).post('/api/tasks').send({title: 'From import test'});
      const exp = await request(fileApp)
        .get('/api/export/database')
        .buffer(true)
        .parse((res: IncomingMessage, fn) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          res.on('end', () => {
            fn(null, Buffer.concat(chunks));
          });
          res.on('error', fn);
        });
      expect(exp.status).toBe(200);
      const buf = exp.body as Buffer;

      await request(fileApp).post('/api/tasks').send({title: 'Noise'});
      const before = await request(fileApp).get('/api/tasks');
      const noiseTitles = before.body.map((t: {title: string}) => t.title);
      expect(noiseTitles).toContain('Noise');

      await request(fileApp).post('/api/import/database').attach('database', buf, 'dump.sqlite').expect(204);

      const after = await request(fileApp).get('/api/tasks');
      const afterTitles = after.body.map((t: {title: string}) => t.title);
      expect(afterTitles).toContain('From import test');
      expect(afterTitles).not.toContain('Noise');
      const imported = after.body.find((t: {title: string}) => t.title === 'From import test');
      expectApiTaskRow(imported);
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('POST /api/import/database with invalid file returns 400 and error message', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-bad-'));
    const dbPath = path.join(dir, 'live.sqlite');
    const ctx = {current: openAndMigrateDatabase(dbPath)};
    const fileApp = createApp(ctx, {dbFilePath: dbPath});
    try {
      const res = await request(fileApp)
        .post('/api/import/database')
        .attach('database', Buffer.from('not-a-sqlite-file'), 'bad.bin');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({message: 'Invalid or incompatible SQLite file'});
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('POST /api/areas with missing or blank name returns 400', async () => {
    const a = await request(app).post('/api/areas').send({});
    expect(a.status).toBe(400);
    expect(a.body).toEqual({message: 'Name required'});
    const b = await request(app).post('/api/areas').send({name: '   '});
    expect(b.status).toBe(400);
    expect(b.body).toEqual({message: 'Name required'});
  });

  it('PUT /api/areas/:id missing area returns 404', async () => {
    const res = await request(app)
      .put('/api/areas/00000000-0000-4000-8000-000000000001')
      .send({name: 'Nope'});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({message: 'Area not found'});
  });

  it('DELETE /api/areas/:id missing area returns 404', async () => {
    const res = await request(app).delete('/api/areas/00000000-0000-4000-8000-000000000002');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({message: 'Area not found'});
  });

  it('PUT /api/tasks/:id missing task returns 404', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-4000-8000-000000000003')
      .send({title: 'Ghost'});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({message: 'Task not found'});
  });

  it('PUT /api/areas/:id updates name and keeps icon when omitted', async () => {
    const created = await request(app).post('/api/areas').send({name: 'Alpha'});
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const put = await request(app).put(`/api/areas/${id}`).send({name: 'Beta'});
    expect(put.status).toBe(200);
    expect(put.body.name).toBe('Beta');
    expect(put.body.icon).toBe(created.body.icon);
  });

  it('PUT /api/areas/:id accepts explicit icon', async () => {
    const created = await request(app).post('/api/areas').send({name: 'Gamma'});
    const id = created.body.id as string;
    const put = await request(app).put(`/api/areas/${id}`).send({name: 'Gamma2', icon: 'folder'});
    expect(put.status).toBe(200);
    expect(put.body).toEqual(
      expect.objectContaining({
        id,
        name: 'Gamma2',
        icon: 'folder',
        sortIndex: expect.any(Number),
        createdAt: expect.any(String),
      }),
    );
  });

  it('PUT /api/areas/:id with invalid name returns 400', async () => {
    const created = await request(app).post('/api/areas').send({name: 'Delta'});
    const id = created.body.id as string;
    const a = await request(app).put(`/api/areas/${id}`).send({});
    expect(a.status).toBe(400);
    expect(a.body).toEqual({message: 'Name required'});
    const b = await request(app).put(`/api/areas/${id}`).send({name: '  '});
    expect(b.status).toBe(400);
    expect(b.body).toEqual({message: 'Name required'});
  });

  it('DELETE /api/areas/:id clears tasks area_id then removes area', async () => {
    const area = await request(app).post('/api/areas').send({name: 'Zeta'});
    const areaId = area.body.id as string;
    const task = await request(app).post('/api/tasks').send({title: 'Linked', areaId});
    expect(task.status).toBe(201);

    const del = await request(app).delete(`/api/areas/${areaId}`);
    expect(del.status).toBe(204);

    const tasks = await request(app).get('/api/tasks');
    const row = tasks.body.find((t: {id: string}) => t.id === task.body.id);
    expect(row).toBeDefined();
    expectApiTaskRow(row);
    expect(row.areaId).toBeNull();
    expect(row.title).toBe('Linked');
  });

  it('POST /api/import/database without file returns 400 when db is file-backed', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-nofile-'));
    const dbPath = path.join(dir, 'live.sqlite');
    const ctx = {current: openAndMigrateDatabase(dbPath)};
    const fileApp = createApp(ctx, {dbFilePath: dbPath});
    try {
      const res = await request(fileApp).post('/api/import/database');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: 'No file uploaded (use form field "database")',
      });
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('serves SPA index for non-API routes when staticDir is set', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-spa-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><body>spa</body></html>');
    const ctx = {current: openAndMigrateDatabase(':memory:')};
    const spaApp = createApp(ctx, {staticDir: dir});
    try {
      const res = await request(spaApp).get('/client-route');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toBe('<!doctype html><html><body>spa</body></html>');
      const api = await request(spaApp).get('/api/tasks');
      expect(api.status).toBe(200);
      expect(api.body).toEqual([]);
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});

/** Minimal row that satisfies the public task contract (tweak per test). */
function contractBaseRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'task-id-1',
    title: 'Title',
    status: 'pending',
    taskDate: null,
    contentJson: '{"root":{"type":"root","version":1}}',
    contentText: '',
    checklistTotal: 0,
    checklistCompleted: 0,
    priority: 'normal',
    estimateMinutes: null,
    pinned: false,
    timeSpentSeconds: 0,
    timerStartedAt: null,
    recurrence: null,
    areaId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('expectApiTaskRow', () => {
  it('accepts a minimal valid row', () => {
    expectApiTaskRow(contractBaseRow());
  });

  it('accepts taskDate as YYYY-MM-DD', () => {
    expectApiTaskRow(contractBaseRow({taskDate: '2025-06-15'}));
  });

  it('accepts numeric estimateMinutes', () => {
    expectApiTaskRow(contractBaseRow({estimateMinutes: 90}));
  });

  it('accepts timerStartedAt as ISO string', () => {
    expectApiTaskRow(contractBaseRow({timerStartedAt: '2025-03-01T08:30:00.000Z'}));
  });

  it('accepts areaId string', () => {
    expectApiTaskRow(contractBaseRow({areaId: 'area-uuid'}));
  });

  it('accepts completed status', () => {
    expectApiTaskRow(contractBaseRow({status: 'completed'}));
  });

  it.each(['low', 'high'] as const)('accepts priority %s', (priority) => {
    expectApiTaskRow(contractBaseRow({priority}));
  });

  it.each(['daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as const)(
    'accepts recurrence %s',
    (recurrence) => {
      expectApiTaskRow(contractBaseRow({recurrence}));
    },
  );

  it('fails when createdAt is not parseable as a date', () => {
    expect(() => expectApiTaskRow(contractBaseRow({createdAt: 'not-a-date'}))).toThrow();
  });

  it('fails when updatedAt is not parseable as a date', () => {
    expect(() => expectApiTaskRow(contractBaseRow({updatedAt: 'also-bad'}))).toThrow();
  });

  it('fails when taskDate is neither null nor a valid date key', () => {
    expect(() => expectApiTaskRow(contractBaseRow({taskDate: '31-12-2025'}))).toThrow();
  });

  it('fails when estimateMinutes is not null nor a finite number', () => {
    expect(() => expectApiTaskRow(contractBaseRow({estimateMinutes: Number.NaN}))).toThrow();
  });

  it('fails when recurrence is not a supported kind', () => {
    expect(() => expectApiTaskRow(contractBaseRow({recurrence: 'hourly'}))).toThrow();
  });

  it('fails when areaId is neither null nor a string', () => {
    expect(() => expectApiTaskRow(contractBaseRow({areaId: 1}))).toThrow();
  });

  it('fails when timerStartedAt is neither null nor a string', () => {
    expect(() => expectApiTaskRow(contractBaseRow({timerStartedAt: 0}))).toThrow();
  });
});
