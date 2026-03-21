import {expect, test} from '@playwright/test';
import type {APIRequestContext, APIResponse} from '@playwright/test';
import {expectJsonContentType} from './api-production-helpers';
import {expectApiAreaRow, expectApiTaskRow} from './contract-expectations';

const GET_LIST_CASES = [
  {
    title: 'GET /api/tasks returns JSON array of full task rows',
    path: '/api/tasks',
    validateRow: expectApiTaskRow,
  },
  {
    title: 'GET /api/areas returns JSON array of area rows',
    path: '/api/areas',
    validateRow: expectApiAreaRow,
  },
] as const;

type NotFoundCase = {
  title: string;
  act: (request: APIRequestContext) => Promise<APIResponse>;
  expectedJson: Record<string, string>;
};

const API_NOT_FOUND_CASES: NotFoundCase[] = [
  {
    title: 'PUT /api/tasks/:id with unknown id returns 404 and message',
    act: (request) =>
      request.put('/api/tasks/00000000-0000-4000-8000-000000000001', {
        data: {title: 'ghost'},
      }),
    expectedJson: {message: 'Task not found'},
  },
  {
    title: 'PUT /api/areas/:id with unknown id returns 404',
    act: (request) =>
      request.put('/api/areas/00000000-0000-4000-8000-000000000002', {
        data: {name: 'x'},
      }),
    expectedJson: {message: 'Area not found'},
  },
  {
    title: 'DELETE /api/areas/:id with unknown id returns 404',
    act: (request) => request.delete('/api/areas/00000000-0000-4000-8000-000000000003'),
    expectedJson: {message: 'Area not found'},
  },
];

test.describe('API (production server)', () => {
  test.describe.configure({mode: 'serial'});

  for (const c of GET_LIST_CASES) {
    test(c.title, async ({request}) => {
      const res = await request.get(c.path);
      expect(res.status()).toBe(200);
      expectJsonContentType(res);
      const body: unknown = await res.json();
      expect(Array.isArray(body)).toBe(true);
      for (const row of body as object[]) {
        c.validateRow(row);
      }
    });
  }

  test('POST /api/tasks returns 201 with a valid task row', async ({request}) => {
    const res = await request.post('/api/tasks', {
      data: {title: 'API create probe'},
    });
    expect(res.status()).toBe(201);
    expectJsonContentType(res);
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
    expectJsonContentType(put);
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

  for (const c of API_NOT_FOUND_CASES) {
    test(c.title, async ({request}) => {
      const res = await c.act(request);
      expect(res.status()).toBe(404);
      expectJsonContentType(res);
      expect(await res.json()).toEqual(c.expectedJson);
    });
  }

  test('POST /api/areas returns 201; row appears on GET; DELETE returns 204', async ({request}) => {
    const post = await request.post('/api/areas', {
      data: {name: '  API area  ', icon: 'folder'},
    });
    expect(post.status()).toBe(201);
    expectJsonContentType(post);
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
