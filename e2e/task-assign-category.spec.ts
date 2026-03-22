import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  assignTaskToCategoryFromFooter,
  clearTaskCategoryFromFooter,
  reloadPageAfterApiSeed,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Assign task to category', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user assigns an unscheduled task to an existing category from the card', async ({
    page,
    request,
  }) => {
    const categoryRes = await request.post('/api/categories', {
      data: {name: 'My Category', icon: 'heart'},
    });
    expect(categoryRes.ok()).toBe(true);
    const {id: categoryId} = (await categoryRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Link me');

    await assignTaskToCategoryFromFooter(page, 'Link me', 'My Category');
    const card = taskCardByTitle(page, 'Link me');
    await expect(card.locator('.taskCard__chip--category')).toContainText('My Category');

    const list = await request.get('/api/tasks');
    const rows = (await list.json()) as {title: string; categoryId: string | null}[];
    const row = rows.find((t) => t.title === 'Link me');
    expect(row).toEqual(expect.objectContaining({title: 'Link me', categoryId}));
  });

  test('user moves task back to “No category”', async ({page, request}) => {
    const categoryRes = await request.post('/api/categories', {
      data: {name: 'Temp', icon: 'folder'},
    });
    expect(categoryRes.ok()).toBe(true);
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Detach');

    await assignTaskToCategoryFromFooter(page, 'Detach', 'Temp');
    const card = taskCardByTitle(page, 'Detach');
    await clearTaskCategoryFromFooter(page, 'Detach');

    await expect(card.locator('.taskCard__chip--category')).toHaveCount(0);
  });
});
