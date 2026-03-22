import {expect, test} from '@playwright/test';
import {createTaskViaApi, putTaskViaApi} from './api-helpers';
import {
  expandTaskCardIfCollapsed,
  localDateYmd,
  reloadPageAfterApiSeed,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

/**
 * **API-first** scenarios (state setup), then **reload** and **UI assertions**.
 * Complements specs that create everything in the UI: here we assert the board
 * reflects persisted data (dates, priority, category, timer, etc.).
 */
test.describe('Task board: API-seeded → UI', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('task with API taskDate=today appears under Today', async ({page, request}) => {
    const title = `Seed today ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, taskDate: localDateYmd()});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();

    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('task marked completed via API appears under Done', async ({page, request}) => {
    const title = `Seed done ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, status: 'completed'});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Done\b/})
      .click();

    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('task with API priority=high shows High in footer when expanded', async ({
    page,
    request,
  }) => {
    const title = `Seed prio ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, priority: 'high'});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    const card = taskCardByTitle(page, title);
    await expandTaskCardIfCollapsed(page, title);
    await expect(card.locator('.taskCard__footerMeta--priority-high')).toBeVisible();
    await expect(card.locator('.taskCard__footerMeta--priority-high')).toHaveText('High');
  });

  test('task with API pinned=true shows Pinned chip on collapsed card', async ({page, request}) => {
    const title = `Seed pin ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, pinned: true});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    const card = taskCardByTitle(page, title);
    await expect(card.locator('.taskCard__chip--pin')).toBeVisible();
  });

  test('task with API estimateMinutes=30 shows 30 min in estimate control', async ({
    page,
    request,
  }) => {
    const title = `Seed est ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, estimateMinutes: 30});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    await expandTaskCardIfCollapsed(page, title);
    await expect(
      taskCardByTitle(page, title).locator('.taskCard__footerEstimateTrigger'),
    ).toContainText('30 min');
  });

  test('task with API categoryId shows category name on chip', async ({page, request}) => {
    const zone = 'Seeded API Zone';
    const categoryRes = await request.post('/api/categories', {data: {name: zone, icon: 'folder'}});
    expect(categoryRes.ok()).toBe(true);
    const {id: categoryId} = (await categoryRes.json()) as {id: string};

    const title = `Seed category ${Date.now()}`;
    await createTaskViaApi(request, {title, categoryId});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    const card = taskCardByTitle(page, title);
    await expect(card.locator('.taskCard__chip--category')).toContainText(zone);
  });

  test('task with API timeSpentSeconds shows duration label in footer', async ({page, request}) => {
    const title = `Seed timer ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {...row, timeSpentSeconds: 125});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    await expandTaskCardIfCollapsed(page, title);
    await expect(taskCardByTitle(page, title).locator('.taskCard__timerLabel')).toHaveText('2:05');
  });

  test('task seeded with tomorrow: UI Clear date moves it to Anytime', async ({page, request}) => {
    const title = `Seed clear ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});

    const t = new Date();
    t.setDate(t.getDate() + 1);
    const tomorrow = localDateYmd(t);
    await putTaskViaApi(request, String(row.id), {...row, taskDate: tomorrow});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Upcoming\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();

    const card = taskCardByTitle(page, title);
    await expandTaskCardIfCollapsed(page, title);
    await card.locator('.taskCard__datePill').click();
    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page.locator('.datePopover__quickActions').getByRole('button', {name: 'Clear'}).click();
    await put;

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('task with API recurrence weekly + taskDate today shows Weekly chip', async ({
    page,
    request,
  }) => {
    const title = `Seed rec ${Date.now()}`;
    const row = await createTaskViaApi(request, {title});
    await putTaskViaApi(request, String(row.id), {
      ...row,
      taskDate: localDateYmd(),
      recurrence: 'weekly',
    });

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();

    const card = taskCardByTitle(page, title);
    await expect(card.locator('.taskCard__datePill--recurring')).toBeVisible();
    await expect(card.getByText('Weekly')).toBeVisible();
  });
});
