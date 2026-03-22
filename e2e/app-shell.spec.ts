import {expect, test} from '@playwright/test';
import {deleteAllCategories, deleteAllTasks} from './api-helpers';
import {gotoWithEnglish} from './helpers';
import {resetBoard} from './task-flow-helpers';

test.describe('App shell', () => {
  test('after load: no global error, loading cleared, primary actions ready', async ({
    page,
    request,
  }) => {
    await resetBoard(page, request);

    // Wait for the shell to be interactive first (slow CI / cold build); then assert no error UI.
    const addTask = page.getByRole('button', {name: 'Add task'});
    await expect(addTask).toBeEnabled({timeout: 30_000});
    await expect(page.locator('.appError')).toHaveCount(0);
    await expect(page.locator('.emptyState--loading')).toHaveCount(0);
    await expect(page.getByRole('navigation', {name: 'Primary navigation'})).toBeVisible();
  });

  test('SPA fallback: unknown path still serves app shell', async ({page, request}) => {
    await deleteAllTasks(request);
    await deleteAllCategories(request);
    await gotoWithEnglish(page, '/this-route-does-not-exist');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
  });
});
