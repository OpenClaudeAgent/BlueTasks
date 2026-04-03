import {expect, test} from '@playwright/test';
import {createTaskViaApi} from './api-helpers';
import {
  addTaskWithTitle,
  expandTaskCardIfCollapsed,
  reloadPageAfterApiSeed,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Task card: click outside to collapse', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('Scenario: expanded task collapses when user clicks outside the card', async ({page}) => {
    const title = `E2E outside ${Date.now()}`;

    await addTaskWithTitle(page, title);

    await expect(page.getByRole('textbox', {name: 'Task title'})).toBeVisible();
    await expect(page.locator('article.taskCard.is-expanded')).toHaveCount(1);

    await page.locator('.mainHeader__title').click();

    await expect(page.getByRole('textbox', {name: 'Task title'})).toHaveCount(0);
    await expect(page.getByRole('button', {name: title, exact: true})).toBeVisible();
    await expect(page.locator('article.taskCard.is-expanded')).toHaveCount(0);
  });

  test('Scenario: expanding another task collapses the first without using the chevron', async ({
    page,
    request,
  }) => {
    const titleA = `E2E row A ${Date.now()}`;
    const titleB = `E2E row B ${Date.now()}`;
    await createTaskViaApi(request, {title: titleA});
    await createTaskViaApi(request, {title: titleB});

    await reloadPageAfterApiSeed(page);
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    await expandTaskCardIfCollapsed(page, titleA);
    const cardA = taskCardByTitle(page, titleA);
    await expect(cardA.getByRole('textbox', {name: 'Task title'})).toBeVisible();

    await page.getByRole('button', {name: titleB, exact: true}).click();

    await expect(taskCardByTitle(page, titleB).getByRole('textbox', {name: 'Task title'})).toBeVisible();
    await expect(cardA.getByRole('button', {name: titleA, exact: true})).toBeVisible();
    await expect(cardA.getByRole('textbox', {name: 'Task title'})).toHaveCount(0);
  });
});
