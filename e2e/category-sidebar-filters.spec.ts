import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  assignTaskToCategoryFromFooter,
  reloadPageAfterApiSeed,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Category filters', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user selects Unassigned and only tasks without category are listed', async ({
    page,
    request,
  }) => {
    const categoryRes = await request.post('/api/categories', {
      data: {name: 'Work Zone', icon: 'folder'},
    });
    expect(categoryRes.ok()).toBe(true);
    const category = (await categoryRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'No category task');
    await addTaskWithTitle(page, 'In zone task');

    await assignTaskToCategoryFromFooter(page, 'In zone task', 'Work Zone');

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /Unassigned/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'No category task')).toBeVisible();
    await expect(taskCardByTitle(page, 'In zone task')).toHaveCount(0);

    await request.delete(`/api/categories/${category.id}`);
  });

  test('user selects a named category and only tasks in that category appear', async ({
    page,
    request,
  }) => {
    const categoryRes = await request.post('/api/categories', {
      data: {name: 'Project X', icon: 'briefcase'},
    });
    expect(categoryRes.ok()).toBe(true);
    const category = (await categoryRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Loose');
    await addTaskWithTitle(page, 'Assigned');

    await assignTaskToCategoryFromFooter(page, 'Assigned', 'Project X');

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /Project X/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(page.getByRole('button', {name: 'Assigned'})).toBeVisible();

    await request.delete(`/api/categories/${category.id}`);
  });

  test('user returns to All categories and sees full section list again', async ({
    page,
    request,
  }) => {
    const categoryRes = await request.post('/api/categories', {data: {name: 'Z', icon: 'folder'}});
    const category = (await categoryRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'A');
    await addTaskWithTitle(page, 'B');

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /Unassigned/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /All categories/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');

    await request.delete(`/api/categories/${category.id}`);
  });
});
