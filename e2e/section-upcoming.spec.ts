import {expect, test} from '@playwright/test';
import {addTaskWithTitle, firstCard, resetBoard, setCardDueDateTomorrow} from './task-flow-helpers';

test.describe('Upcoming section', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user sets due date to tomorrow and task appears under Upcoming', async ({page}) => {
    const title = `E2E upcoming ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await setCardDueDateTomorrow(page, card);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Upcoming\b/})
      .click();
    await expect(page.getByRole('heading', {level: 1, name: 'Upcoming'})).toBeVisible();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('user moves task from Upcoming to Today via date pill', async ({page}) => {
    const title = `E2E to today ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await setCardDueDateTomorrow(page, card);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Upcoming\b/})
      .click();
    await page.getByRole('button', {name: title}).click();

    await firstCard(page).locator('.taskCard__datePill').click();
    await page
      .locator('.datePopover__quickActions')
      .getByRole('button', {name: 'Today', exact: true})
      .click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
  });
});

test.describe('Today section (overdue / roll-up)', () => {
  test('user with yesterday’s date sees task under Today', async ({page, request}) => {
    await resetBoard(page, request);

    const create = await request.post('/api/tasks', {data: {title: 'Overdue API seed'}});
    expect(create.ok()).toBe(true);
    const row = (await create.json()) as Record<string, unknown>;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const taskDate = y.toISOString().slice(0, 10);

    const put = await request.put(`/api/tasks/${row.id as string}`, {
      data: {...row, taskDate},
    });
    expect(put.ok()).toBe(true);

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    await expect(page.getByRole('button', {name: 'Overdue API seed'})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });
});
