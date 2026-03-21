import fs from 'node:fs';
import type {IncomingMessage} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {afterAll, describe, expect, it} from 'vitest';
import request from 'supertest';
import {createApp} from './createApp.js';
import {openAndMigrateDatabase} from './dbSetup.js';

const dbCtx = {current: openAndMigrateDatabase(':memory:')};
const app = createApp(dbCtx, {});

afterAll(() => {
  dbCtx.current.close();
});

describe('API HTTP', () => {
  it('GET /api/tasks retourne un tableau', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/areas puis tâche liée', async () => {
    const area = await request(app).post('/api/areas').send({name: 'Projet'});
    expect(area.status).toBe(201);
    const areaId = area.body.id as string;

    const task = await request(app).post('/api/tasks').send({
      title: 'Tâche liée',
      areaId,
    });
    expect(task.status).toBe(201);
    expect(task.body.areaId).toBe(areaId);

    const list = await request(app).get('/api/tasks');
    expect(list.body.some((t: {id: string}) => t.id === task.body.id)).toBe(true);
  });

  it('PUT /api/tasks/:id met à jour', async () => {
    const created = await request(app).post('/api/tasks').send({title: 'A'});
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const updated = await request(app).put(`/api/tasks/${id}`).send({
      ...created.body,
      title: 'B',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('B');
  });

  it('DELETE /api/tasks/:id renvoie 204', async () => {
    const created = await request(app).post('/api/tasks').send({title: 'À supprimer'});
    const id = created.body.id as string;
    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);
  });

  it('GET /api/export/database renvoie un fichier sqlite', async () => {
    await request(app).post('/api/tasks').send({title: 'Pour export'});
    const res = await request(app).get('/api/export/database').buffer(true);
    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toContain('sqlite');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/bluetasks-\d{4}-\d{2}-\d{2}\.sqlite/);
  });

  it('GET /api/export/database OK même sans tâches (base vide)', async () => {
    const emptyCtx = {current: openAndMigrateDatabase(':memory:')};
    const appEmpty = createApp(emptyCtx, {});
    try {
      const res = await request(appEmpty).get('/api/export/database').buffer(true);
      expect(res.status).toBe(200);
      expect(String(res.headers['content-type'])).toContain('sqlite');
    } finally {
      emptyCtx.current.close();
    }
  });

  it('POST /api/import/database sans stockage fichier → 501', async () => {
    const res = await request(app).post('/api/import/database');
    expect(res.status).toBe(501);
  });

  it('POST /api/import/database restaure une base exportée', async () => {
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
      expect(before.body.some((t: {title: string}) => t.title === 'Noise')).toBe(true);

      await request(fileApp).post('/api/import/database').attach('database', buf, 'dump.sqlite').expect(204);

      const after = await request(fileApp).get('/api/tasks');
      expect(after.body.some((t: {title: string}) => t.title === 'From import test')).toBe(true);
      expect(after.body.some((t: {title: string}) => t.title === 'Noise')).toBe(false);
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('POST /api/import/database fichier invalide → 400', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluetasks-bad-'));
    const dbPath = path.join(dir, 'live.sqlite');
    const ctx = {current: openAndMigrateDatabase(dbPath)};
    const fileApp = createApp(ctx, {dbFilePath: dbPath});
    try {
      const res = await request(fileApp)
        .post('/api/import/database')
        .attach('database', Buffer.from('not-a-sqlite-file'), 'bad.bin');
      expect(res.status).toBe(400);
    } finally {
      ctx.current.close();
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('POST /api/areas sans nom valide → 400', async () => {
    const a = await request(app).post('/api/areas').send({});
    expect(a.status).toBe(400);
    const b = await request(app).post('/api/areas').send({name: '   '});
    expect(b.status).toBe(400);
  });

  it('PUT /api/areas/:id inexistant → 404', async () => {
    const res = await request(app)
      .put('/api/areas/00000000-0000-4000-8000-000000000001')
      .send({name: 'Nope'});
    expect(res.status).toBe(404);
  });

  it('DELETE /api/areas/:id inexistant → 404', async () => {
    const res = await request(app).delete('/api/areas/00000000-0000-4000-8000-000000000002');
    expect(res.status).toBe(404);
  });

  it('PUT /api/tasks/:id inexistant → 404', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-4000-8000-000000000003')
      .send({title: 'Ghost'});
    expect(res.status).toBe(404);
  });
});
