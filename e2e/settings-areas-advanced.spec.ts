import {expect, test} from '@playwright/test';
import {resetBoard} from './task-flow-helpers';

test.describe('Settings: areas CRUD', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user renames an area and sidebar shows new name', async ({page}) => {
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Areas'}).click();

    await dialog.getByPlaceholder('New area name').fill('OldName');
    await dialog.getByRole('button', {name: 'Add'}).click();
    await expect(dialog.getByText('OldName')).toBeVisible();

    await dialog.getByRole('button', {name: 'Rename area'}).click();
    await dialog.locator('.settingsDialog__rowEdit input').fill('NewBrand');
    await dialog.getByRole('button', {name: 'Save'}).click();

    await expect(dialog.getByText('NewBrand')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.locator('.sidebar__areasNav').getByRole('button', {name: /NewBrand/})).toBeVisible();
  });

  test('user changes area icon and it reflects on the sidebar row', async ({page}) => {
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Areas'}).click();

    await dialog.getByPlaceholder('New area name').fill('IconTest');
    await dialog.getByRole('button', {name: 'Add'}).click();

    await dialog.getByRole('button', {name: 'Rename area'}).click();
    await dialog.locator('.settingsDialog__rowEdit .areaIconPicker').getByRole('button', {name: 'briefcase', exact: true}).click();
    await dialog.getByRole('button', {name: 'Save'}).click();
    await page.keyboard.press('Escape');

    await expect(page.locator('.sidebar__areasNav').getByRole('button', {name: /IconTest/})).toBeVisible();
  });

  test('user deletes an empty area and it disappears from sidebar', async ({page}) => {
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Areas'}).click();

    await dialog.getByPlaceholder('New area name').fill('EmptyZone');
    await dialog.getByRole('button', {name: 'Add'}).click();

    page.once('dialog', (d) => void d.accept());
    await dialog.locator('.settingsDialog__row').filter({hasText: 'EmptyZone'}).getByRole('button', {name: 'Delete'}).click();

    await expect(dialog.getByText('EmptyZone')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.sidebar__areasNav').getByRole('button', {name: /EmptyZone/})).toHaveCount(0);
  });

  test('user deletes an area with tasks and tasks become unassigned (confirm copy)', async ({page, request}) => {
    const areaRes = await request.post('/api/areas', {data: {name: 'WithTasks', icon: 'folder'}});
    const area = (await areaRes.json()) as {id: string};
    await request.post('/api/tasks', {data: {title: 'Linked', areaId: area.id}});

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Areas'}).click();

    page.once('dialog', (d) => {
      expect(d.message()).toContain('WithTasks');
      void d.accept();
    });
    await dialog.locator('.settingsDialog__row').filter({hasText: 'WithTasks'}).getByRole('button', {name: 'Delete'}).click();

    await expect(dialog.getByText('WithTasks')).toHaveCount(0);
    await page.keyboard.press('Escape');

    const list = await request.get('/api/tasks');
    const rows = (await list.json()) as {title: string; areaId: string | null}[];
    const row = rows.find((t) => t.title === 'Linked');
    expect(row?.areaId).toBeNull();
  });
});
