import {expect, test} from '@playwright/test';
import {deleteAllAreas, deleteAllTasks} from './api-helpers';
import {expectApiAreaRow} from './contract-expectations';
import {gotoWithEnglish} from './helpers';

test.describe('End-to-end: navigation and settings', () => {
  test('user switches section (Today → Anytime) and sees matching heading', async ({page}) => {
    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('heading', {level: 1, name: 'Today'})).toBeVisible();

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();

    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();
    await expect(page.getByRole('heading', {level: 2, name: 'Anytime'})).toBeVisible();
  });

  test('user opens Settings, General tab shows language and export', async ({page}) => {
    await gotoWithEnglish(page, '/');
    await page.getByRole('button', {name: 'Settings'}).click();

    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', {name: 'General'}).click();

    await expect(dialog.getByRole('heading', {level: 3, name: 'Language'})).toBeVisible();
    await expect(dialog.getByRole('heading', {level: 3, name: 'Your data'})).toBeVisible();
    await expect(dialog.getByRole('button', {name: 'Export SQLite database'})).toBeVisible();
    await expect(dialog.getByRole('button', {name: 'Import SQLite database'})).toBeEnabled();
  });

  test('user creates an area from Settings', async ({page, request}) => {
    await deleteAllAreas(request);
    await deleteAllTasks(request);

    const areaName = `E2E Area ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});

    await dialog.getByRole('button', {name: 'Areas'}).click();
    await expect(dialog.getByText(/Create areas/i)).toBeVisible();

    const postArea = page.waitForResponse(
      (r) =>
        r.url().includes('/api/areas') && r.request().method() === 'POST' && r.status() === 201,
    );
    await dialog.getByPlaceholder('New area name').fill(areaName);
    await dialog.getByRole('button', {name: 'Add'}).click();
    const areaRes = await postArea;
    const created = await areaRes.json();
    expectApiAreaRow(created);
    expect(created.name).toBe(areaName);

    await expect(dialog.getByText(areaName)).toBeVisible();
  });
});
