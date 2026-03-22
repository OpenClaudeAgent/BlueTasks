import {expect, test} from '@playwright/test';
import {expectApiTaskRow} from './contract-expectations';
import {addTaskWithTitle, resetBoard} from './task-flow-helpers';
import {gotoWithEnglish} from './helpers';

test.describe('End-to-end: task lifecycle', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
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
    const postRes = await post;
    expect(postRes.status()).toBe(201);
    expectApiTaskRow(await postRes.json());

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await expect(titleInput).toBeVisible();

    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await titleInput.fill(title);
    await titleInput.blur();
    const putRes = await put;
    expect(putRes.status()).toBe(200);
    const saved = await putRes.json();
    expectApiTaskRow(saved);
    expect(saved.title).toBe(title);

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('setting due date to Today moves task from Anytime to Today', async ({page}) => {
    const title = `E2E today ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('heading', {level: 1, name: 'Today'})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('0');

    const post = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.ok(),
    );
    await page.getByRole('button', {name: 'Add task'}).click();
    const postRes = await post;
    expect(postRes.status()).toBe(201);
    expectApiTaskRow(await postRes.json());

    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await titleInput.fill(title);
    const putTitle = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await titleInput.blur();
    await putTitle;

    await expect(page.locator('.taskBoard__count')).toHaveText('1');

    await page.getByRole('button', {name: 'Collapse task'}).click();
    const card = page.locator('article.taskCard').first();
    await card.locator('.taskCard__datePill').click();
    const putDate = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page
      .locator('.datePopover__quickActions')
      .getByRole('button', {name: 'Today', exact: true})
      .click();
    const putDateRes = await putDate;
    const withDate = await putDateRes.json();
    expectApiTaskRow(withDate);
    expect(withDate.taskDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('user marks a task done and sees it under Done', async ({page, request}) => {
    const title = `E2E done ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    const post = page.waitForResponse(
      (r) =>
        r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.status() === 201,
    );
    await page.getByRole('button', {name: 'Add task'}).click();
    await post;

    const titleInput = page.getByRole('textbox', {name: 'Task title'});
    await titleInput.fill(title);
    const put = page.waitForResponse(
      (r) =>
        r.request().method() === 'PUT' && r.url().includes('/api/tasks/') && r.status() === 200,
    );
    await titleInput.blur();
    await put;

    await page.getByRole('button', {name: 'Collapse task'}).click();
    const card = page.locator('article.taskCard').first();
    await card.getByRole('button', {name: 'Mark as done'}).click();

    await expect
      .poll(
        async () => {
          const res = await request.get('/api/tasks');
          if (!res.ok()) {
            return false;
          }
          const tasks = (await res.json()) as {title: string; status: string}[];
          return tasks.some((t) => t.title === title && t.status === 'completed');
        },
        {timeout: 20_000},
      )
      .toBe(true);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Done\b/})
      .click();

    await expect(page.getByRole('heading', {level: 1, name: 'Done'})).toBeVisible();
    await expect(page.getByRole('heading', {level: 2, name: 'Done'})).toBeVisible();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Done\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('user reopens a completed task from Done', async ({page}) => {
    const title = `E2E reopen ${Date.now()}`;

    await addTaskWithTitle(page, title);

    await page.getByRole('button', {name: 'Collapse task'}).click();
    const putDone = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page
      .locator('article.taskCard')
      .first()
      .getByRole('button', {name: 'Mark as done'})
      .click();
    await putDone;

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Done\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();

    const reopenPut = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page.getByRole('button', {name: 'Reopen task'}).click();
    const reopenRes = await reopenPut;
    expect((await reopenRes.json()).status).toBe('pending');

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
  });

  test('user deletes a task from the expanded card', async ({page}) => {
    const title = `E2E delete ${Date.now()}`;

    await addTaskWithTitle(page, title);

    const card = page.locator('article.taskCard');
    await card.getByRole('button', {name: 'Delete', exact: true}).click();
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(title);

    const del = page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && r.url().includes('/api/tasks/') && r.ok(),
    );
    await confirmDialog.getByRole('button', {name: 'Delete', exact: true}).click();
    await del;

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toHaveCount(0);
    await expect(page.locator('.taskBoard__count')).toHaveText('0');
  });

  test('user expands and collapses a task card', async ({page}) => {
    const title = `E2E expand ${Date.now()}`;

    await addTaskWithTitle(page, title);

    await page.getByRole('button', {name: 'Collapse task'}).click();
    const card = page.locator('article.taskCard').first();
    await expect(card.getByRole('textbox', {name: 'Task title'})).toBeHidden();
    await expect(card.getByRole('button', {name: 'Expand task'})).toBeVisible();

    await card.getByRole('button', {name: 'Expand task'}).click();
    await expect(page.getByRole('textbox', {name: 'Task title'})).toBeVisible();
  });
});
