import {expect, type APIRequestContext} from '@playwright/test';

/** Create a task row via POST /api/tasks (full row returned). */
export async function createTaskViaApi(
  request: APIRequestContext,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await request.post('/api/tasks', {data});
  const text = await res.text();
  expect(res.ok(), text).toBe(true);
  return JSON.parse(text) as Record<string, unknown>;
}

/** Replace a task via PUT /api/tasks/:id (send full row from a previous GET/POST/PUT). */
export async function putTaskViaApi(
  request: APIRequestContext,
  id: string,
  row: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await request.put(`/api/tasks/${id}`, {data: row});
  const text = await res.text();
  expect(res.ok(), text).toBe(true);
  return JSON.parse(text) as Record<string, unknown>;
}

/** Empty all tasks via the running server (serial E2E cleanup). */
export async function deleteAllTasks(request: APIRequestContext): Promise<void> {
  const res = await request.get('/api/tasks');
  expect(res.ok()).toBe(true);
  const tasks = (await res.json()) as {id: string}[];
  await Promise.all(tasks.map((task) => request.delete(`/api/tasks/${task.id}`)));
}

/** Empty all categories via the running server (serial E2E cleanup). */
export async function deleteAllCategories(request: APIRequestContext): Promise<void> {
  const res = await request.get('/api/categories');
  expect(res.ok()).toBe(true);
  const categories = (await res.json()) as {id: string}[];
  await Promise.all(categories.map((c) => request.delete(`/api/categories/${c.id}`)));
}
