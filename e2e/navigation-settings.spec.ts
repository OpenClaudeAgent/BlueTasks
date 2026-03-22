import {expect, test} from '@playwright/test';
import {deleteAllCategories, deleteAllTasks} from './api-helpers';
import {expectApiCategoryRow} from './contract-expectations';
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
    // Hidden file input shares the same accessible name as the visible trigger (a11y label).
    await expect(dialog.locator('button.settingsDialog__importBtn')).toBeEnabled();
  });

  test('user creates a category from Settings', async ({page, request}) => {
    await deleteAllCategories(request);
    await deleteAllTasks(request);

    const categoryName = `E2E Category ${Date.now()}`;

    await gotoWithEnglish(page, '/');
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});

    await dialog.getByRole('button', {name: 'Categories'}).click();
    await expect(dialog.getByText(/Create categories/i)).toBeVisible();

    const postCategory = page.waitForResponse(
      (r) =>
        r.url().includes('/api/categories') && r.request().method() === 'POST' && r.status() === 201,
    );
    await dialog.getByPlaceholder('New category name').fill(categoryName);
    await dialog.getByRole('button', {name: 'Add'}).click();
    const categoryRes = await postCategory;
    const created = await categoryRes.json();
    expectApiCategoryRow(created);
    expect(created.name).toBe(categoryName);

    await expect(dialog.getByText(categoryName)).toBeVisible();
  });
});
