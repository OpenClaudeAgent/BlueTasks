import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  applyWeeklyRecurrenceOnCard,
  expandTaskCardIfCollapsed,
  firstCard,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Time estimate', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user opens estimate popover and selects a preset (e.g. 30 min)', async ({page}) => {
    const title = `E2E estimate ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await card.locator('button[title="Time estimate"]').click();
    await page.locator('.footerPopover').getByRole('button', {name: '30 min'}).click();

    await expect(card.locator('.taskCard__footerEstimateTrigger')).toContainText('30 min');
  });

  test('user clears estimate back to “No estimate”', async ({page}) => {
    const title = `E2E estimate clear ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await card.locator('button[title="Time estimate"]').click();
    await page.locator('.footerPopover').getByRole('button', {name: '30 min'}).click();
    await card.locator('button[title="Time estimate"]').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'No estimate'}).click();

    await expect(card.locator('.taskCard__footerEstimateTrigger')).toContainText('No estimate');
  });
});

test.describe('Recurrence', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user sets weekly repeat on a task', async ({page}) => {
    const title = `E2E recurrence ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await applyWeeklyRecurrenceOnCard(page, card);

    // Weekly sets implicit due date → task moves to Today while the section may still be Anytime.
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    const onToday = taskCardByTitle(page, title);
    await expect(onToday.locator('.taskCard__datePill--recurring')).toBeVisible();
  });

  test('user clears recurrence to “No repeat”', async ({page}) => {
    const title = `E2E recurrence off ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await applyWeeklyRecurrenceOnCard(page, card);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    const onToday = taskCardByTitle(page, title);
    await expandTaskCardIfCollapsed(page, title);
    await onToday.locator('button[title="Repeat"]').click();
    const putOff = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page.locator('.footerPopover').getByRole('button', {name: 'No repeat'}).click();
    await putOff;

    await expect(onToday.locator('.taskCard__datePill--recurring')).toHaveCount(0);
  });
});

test.describe('Recurring task completion', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user completes a recurring task and sees next due date (not plain “done”)', async ({
    page,
  }) => {
    const title = `E2E recur done ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    // Due date must be set before recurrence: changing the date clears recurrence in the client.
    await card.locator('.taskCard__datePill').click();
    const putDate = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await page
      .locator('.datePopover__quickActions')
      .getByRole('button', {name: 'Today', exact: true})
      .click();
    await putDate;

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Today\b/})
      .click();
    const todayCard = taskCardByTitle(page, title);
    await expandTaskCardIfCollapsed(page, title);

    const putRec = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await todayCard.locator('button[title="Repeat"]').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'Weekly'}).click();
    await putRec;

    await page.getByRole('button', {name: 'Collapse task'}).click();
    const collapsed = taskCardByTitle(page, title);
    await collapsed.getByRole('button', {name: /Complete occurrence/}).click();
    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          if (!res.ok()) {
            return false;
          }
          const tasks = (await res.json()) as {
            title: string;
            taskDate: string | null;
            status: string;
          }[];
          const row = tasks.find((t) => t.title === title);
          return Boolean(row && row.status === 'pending' && row.taskDate);
        },
        {timeout: 15_000},
      )
      .toBe(true);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Upcoming\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });
});
