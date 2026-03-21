import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  expandTaskCardIfCollapsed,
  reloadPageAfterApiSeed,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Assign task to area', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user assigns an unscheduled task to an existing area from the card', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'My Area', icon: 'heart'}});
    expect(areaRes.ok()).toBe(true);
    const {id: areaId} = (await areaRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Link me');

    const card = taskCardByTitle(page, 'Link me');
    await expandTaskCardIfCollapsed(page, 'Link me');
    await card.locator('.taskCard__footerAreaTrigger').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'My Area'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await expect(card.locator('.taskCard__chip--area')).toContainText('My Area');

    const list = await request.get('/api/tasks');
    const rows = (await list.json()) as {title: string; areaId: string | null}[];
    const row = rows.find((t) => t.title === 'Link me');
    expect(row).toEqual(expect.objectContaining({title: 'Link me', areaId}));
  });

  test('user moves task back to “No area”', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'Temp', icon: 'folder'}});
    expect(areaRes.ok()).toBe(true);
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Detach');

    const card = taskCardByTitle(page, 'Detach');
    await expandTaskCardIfCollapsed(page, 'Detach');
    await card.locator('.taskCard__footerAreaTrigger').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'Temp'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await card.locator('.taskCard__footerAreaTrigger').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'No area'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await expect(card.locator('.taskCard__chip--area')).toHaveCount(0);
  });
});
