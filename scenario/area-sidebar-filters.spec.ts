import {expect, test} from '@playwright/test';
import {addTaskWithTitle, expandTaskCardIfCollapsed, reloadPageAfterApiSeed, resetBoard, taskCardByTitle} from './task-flow-helpers';

test.describe('Area filters', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user selects Unassigned and only tasks without area are listed', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'Work Zone', icon: 'folder'}});
    expect(areaRes.ok()).toBe(true);
    const area = (await areaRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'No area task');
    await addTaskWithTitle(page, 'In zone task');

    await expandTaskCardIfCollapsed(page, 'In zone task');
    await taskCardByTitle(page, 'In zone task').locator('.taskCard__footerAreaTrigger').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'Work Zone'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /Unassigned/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'No area task')).toBeVisible();
    await expect(taskCardByTitle(page, 'In zone task')).toHaveCount(0);

    await request.delete(`/api/areas/${area.id}`);
  });

  test('user selects a named area and only tasks in that area appear', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'Project X', icon: 'briefcase'}});
    expect(areaRes.ok()).toBe(true);
    const area = (await areaRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'Loose');
    await addTaskWithTitle(page, 'Assigned');

    await expandTaskCardIfCollapsed(page, 'Assigned');
    await taskCardByTitle(page, 'Assigned').locator('.taskCard__footerAreaTrigger').click();
    await page.locator('.footerPopover').getByRole('button', {name: 'Project X'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /Project X/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(page.getByRole('button', {name: 'Assigned'})).toBeVisible();

    await request.delete(`/api/areas/${area.id}`);
  });

  test('user returns to All areas and sees full section list again', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'Z', icon: 'folder'}});
    const area = (await areaRes.json()) as {id: string};
    await reloadPageAfterApiSeed(page);

    await addTaskWithTitle(page, 'A');
    await addTaskWithTitle(page, 'B');

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /Unassigned/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /All areas/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');

    await request.delete(`/api/areas/${area.id}`);
  });
});
