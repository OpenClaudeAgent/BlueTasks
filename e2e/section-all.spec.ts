import {expect, test} from '@playwright/test';
import {addTaskWithTitle, markTaskDoneAfterCollapse, resetBoard} from './task-flow-helpers';

test.describe('All section', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user sees open and done tasks together under All', async ({page}) => {
    const openTitle = `E2E all open ${Date.now()}`;
    const doneTitle = `E2E all done ${Date.now()}`;

    await addTaskWithTitle(page, openTitle);
    await addTaskWithTitle(page, doneTitle);

    await markTaskDoneAfterCollapse(page, doneTitle);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^All\b/})
      .click();

    await expect(page.getByRole('heading', {level: 1, name: 'All'})).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');
    await expect(page.getByRole('button', {name: openTitle})).toBeVisible();
    await expect(page.getByRole('button', {name: doneTitle})).toBeVisible();
  });
});
