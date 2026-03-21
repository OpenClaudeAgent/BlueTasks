import {expect, test} from '@playwright/test';
import {expectApiAreaRow, expectApiTaskRow} from './contract-expectations';

test.describe('API (production server)', () => {
  test.describe.configure({mode: 'serial'});

  test('GET /api/tasks returns JSON array of full task rows', async ({request}) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/json/i);
    const body: unknown = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const row of body as object[]) {
      expectApiTaskRow(row);
    }
  });

  test('GET /api/areas returns JSON array of area rows', async ({request}) => {
    const res = await request.get('/api/areas');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    const body: unknown = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const row of body as object[]) {
      expectApiAreaRow(row);
    }
  });

  test('POST /api/tasks returns 201 with a valid task row', async ({request}) => {
    const res = await request.post('/api/tasks', {
      data: {title: 'API create probe'},
    });
    expect(res.status()).toBe(201);
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    const row: unknown = await res.json();
    expectApiTaskRow(row);
    expect((row as {title: string}).title).toBe('API create probe');
    expect((row as {status: string}).status).toBe('pending');
    await request.delete(`/api/tasks/${(row as {id: string}).id}`);
  });

  test('PUT /api/tasks/:id returns 200, preserves createdAt, contract holds', async ({request}) => {
    const create = await request.post('/api/tasks', {data: {title: 'PUT before'}});
    expect(create.status()).toBe(201);
    const created = (await create.json()) as Record<string, unknown>;
    expectApiTaskRow(created);
    const id = created.id as string;
    const createdAt = created.createdAt as string;

    const put = await request.put(`/api/tasks/${id}`, {
      data: {
        ...created,
        title: 'PUT after',
        status: 'completed',
      },
    });
    expect(put.status()).toBe(200);
    expect(put.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    const updated = (await put.json()) as Record<string, unknown>;
    expectApiTaskRow(updated);
    expect(updated.title).toBe('PUT after');
    expect(updated.status).toBe('completed');
    expect(updated.id).toBe(id);
    expect(updated.createdAt).toBe(createdAt);
    expect(Date.parse(updated.updatedAt as string)).toBeGreaterThanOrEqual(Date.parse(createdAt));

    await request.delete(`/api/tasks/${id}`);
  });

  test('DELETE /api/tasks/:id returns 204 and removes the task', async ({request}) => {
    const create = await request.post('/api/tasks', {data: {title: 'DELETE probe'}});
    expect(create.status()).toBe(201);
    const {id} = (await create.json()) as {id: string};

    const del = await request.delete(`/api/tasks/${id}`);
    expect(del.status()).toBe(204);

    const list = await request.get('/api/tasks');
    expect(list.status()).toBe(200);
    const tasks = (await list.json()) as {id: string}[];
    expect(tasks.find((t) => t.id === id)).toBeUndefined();
  });

  test('PUT /api/tasks/:id with unknown id returns 404 and message', async ({request}) => {
    const res = await request.put('/api/tasks/00000000-0000-4000-8000-000000000001', {
      data: {title: 'ghost'},
    });
    expect(res.status()).toBe(404);
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    expect(await res.json()).toEqual({message: 'Task not found'});
  });

  test('POST /api/areas returns 201; row appears on GET; DELETE returns 204', async ({request}) => {
    const post = await request.post('/api/areas', {
      data: {name: '  API area  ', icon: 'folder'},
    });
    expect(post.status()).toBe(201);
    expect(post.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    const created = (await post.json()) as Record<string, unknown>;
    expectApiAreaRow(created);
    expect(created.name).toBe('API area');

    const list = await request.get('/api/areas');
    expect(list.status()).toBe(200);
    const areas = (await list.json()) as Record<string, unknown>[];
    const found = areas.find((a) => a.id === created.id);
    expect(found).toEqual(expect.objectContaining({id: created.id, name: 'API area'}));
    expectApiAreaRow(found);

    const del = await request.delete(`/api/areas/${created.id as string}`);
    expect(del.status()).toBe(204);

    const after = await request.get('/api/areas');
    const ids = ((await after.json()) as {id: string}[]).map((a) => a.id);
    expect(ids).not.toContain(created.id as string);
  });

  test('POST /api/areas with empty name returns 400', async ({request}) => {
    const res = await request.post('/api/areas', {data: {name: '   '}});
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({message: 'Name required'});
  });

  test('PUT /api/areas/:id updates name and returns full row', async ({request}) => {
    const post = await request.post('/api/areas', {data: {name: 'Rename me'}});
    expect(post.status()).toBe(201);
    const {id} = (await post.json()) as {id: string};

    const put = await request.put(`/api/areas/${id}`, {data: {name: 'Renamed'}});
    expect(put.status()).toBe(200);
    const row = (await put.json()) as Record<string, unknown>;
    expectApiAreaRow(row);
    expect(row.id).toBe(id);
    expect(row.name).toBe('Renamed');

    await request.delete(`/api/areas/${id}`);
  });

  test('PUT /api/areas/:id with unknown id returns 404', async ({request}) => {
    const res = await request.put('/api/areas/00000000-0000-4000-8000-000000000002', {
      data: {name: 'x'},
    });
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({message: 'Area not found'});
  });

  test('DELETE /api/areas/:id with unknown id returns 404', async ({request}) => {
    const res = await request.delete('/api/areas/00000000-0000-4000-8000-000000000003');
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({message: 'Area not found'});
  });

  test('POST /api/tasks with areaId persists link when area exists', async ({request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'Task area'}});
    expect(areaRes.status()).toBe(201);
    const area = (await areaRes.json()) as {id: string};

    const taskRes = await request.post('/api/tasks', {
      data: {title: 'Linked task', areaId: area.id},
    });
    expect(taskRes.status()).toBe(201);
    const task = (await taskRes.json()) as Record<string, unknown>;
    expectApiTaskRow(task);
    expect(task.areaId).toBe(area.id);

    const again = await request.get('/api/tasks');
    const rows = (await again.json()) as Record<string, unknown>[];
    const persisted = rows.find((r) => r.id === task.id);
    expect(persisted?.areaId).toBe(area.id);

    await request.delete(`/api/tasks/${task.id as string}`);
    await request.delete(`/api/areas/${area.id}`);
  });

  test('DELETE /api/tasks/:id returns 204 even when id is unknown (idempotent)', async ({request}) => {
    const res = await request.delete('/api/tasks/00000000-0000-4000-8000-000000009999');
    expect(res.status()).toBe(204);
  });
});
