import {test, expect, type APIRequestContext} from '@playwright/test';
import {gotoWithEnglish} from './helpers';

async function deleteAllTasks(request: APIRequestContext) {
  const res = await request.get('/api/tasks');
  const tasks = (await res.json()) as {id: string}[];
  await Promise.all(tasks.map((task) => request.delete(`/api/tasks/${task.id}`)));
}

test.describe('API (production server)', () => {
  test('GET /api/tasks returns JSON task rows', async ({request}) => {
    const res = await request.get('/api/tasks');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/i);
    const body: unknown = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const row of body as object[]) {
      expect(row).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        status: expect.stringMatching(/^(pending|completed)$/),
      });
    }
  });
});

test.describe('End-to-end: task lifecycle', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({request}) => {
    await deleteAllTasks(request);
  });

  test('user adds a task, title is saved, survives reload', async ({page}) => {
    const title = `E2E save ${Date.now()}`;

    await gotoWithEnglish(page, '/');

    const addBtn = page.getByRole('button', {name: 'Add task'});
    await expect(addBtn).toBeEnabled({timeout: 30_000});

    const post = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.ok(),
    );
    await addBtn.click();
    await post;

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await expect(titleInput).toBeVisible();

    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await titleInput.fill(title);
    await titleInput.blur();
    await put;

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    // New tasks have no due date → they live under Anytime; initial section after reload is Today.
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
  });

  test('user marks a task done and sees it under Done', async ({page}) => {
    const title = `E2E done ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    const post = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.ok(),
    );
    await page.getByRole('button', {name: 'Add task'}).click();
    await post;

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await titleInput.fill(title);
    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await titleInput.blur();
    await put;

    // Card stays expanded after edit; title is in a textbox, not the row title button.
    await page.getByRole('button', {name: 'Collapse task'}).click();
    const card = page.getByRole('article').filter({has: page.getByRole('button', {name: title})});
    await card.getByRole('button', {name: 'Mark as done'}).click();

    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Done\b/}).click();

    await expect(page.getByRole('heading', {level: 1, name: 'Done'})).toBeVisible();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
  });

  test('user expands and collapses a task card', async ({page}) => {
    const title = `E2E expand ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    const post = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.ok(),
    );
    await page.getByRole('button', {name: 'Add task'}).click();
    await post;

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await titleInput.fill(title);
    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await titleInput.blur();
    await put;

    // Serial suite + empty DB ⇒ a single task card. Do not chain off `filter({ has: title button })` after collapse:
    // once expanded again, that button is replaced by the title textbox and the filter would stop matching.
    await page.getByRole('button', {name: 'Collapse task'}).click();
    const card = page.locator('article.taskCard').first();
    await expect(card.getByRole('textbox', {name: 'Task title'})).not.toBeVisible();
    await expect(card.getByRole('button', {name: 'Expand task'})).toBeVisible();

    await card.getByRole('button', {name: 'Expand task'}).click();
    await expect(page.getByRole('textbox', {name: 'Task title'})).toBeVisible();
  });
});

test.describe('End-to-end: navigation and settings', () => {
  test('user switches section (Today → Anytime) and sees matching heading', async ({page}) => {
    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('heading', {level: 1, name: 'Today'})).toBeVisible();

    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();

    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();
    await expect(page.getByRole('heading', {level: 2, name: 'Anytime'})).toBeVisible();
  });

  test('user opens Settings, General tab shows language and export', async ({page}) => {
    await gotoWithEnglish(page, '/');
    await page.getByRole('button', {name: 'Settings'}).click();

    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', {name: 'General'}).click();

    await expect(dialog.getByRole('heading', {level: 3, name: 'Language'})).toBeVisible();
    await expect(dialog.getByRole('button', {name: 'Export SQLite database'})).toBeVisible();
  });
});
