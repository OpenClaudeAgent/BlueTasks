import {expect, type APIRequestContext} from '@playwright/test';

/** Empty all tasks via the running server (serial E2E cleanup). */
export async function deleteAllTasks(request: APIRequestContext): Promise<void> {
  const res = await request.get('/api/tasks');
  expect(res.ok()).toBe(true);
  const tasks = (await res.json()) as {id: string}[];
  await Promise.all(tasks.map((task) => request.delete(`/api/tasks/${task.id}`)));
}

/** Empty all areas via the running server (serial E2E cleanup). */
export async function deleteAllAreas(request: APIRequestContext): Promise<void> {
  const res = await request.get('/api/areas');
  expect(res.ok()).toBe(true);
  const areas = (await res.json()) as {id: string}[];
  await Promise.all(areas.map((a) => request.delete(`/api/areas/${a.id}`)));
}
