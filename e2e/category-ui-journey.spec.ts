import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  assignTaskToCategoryFromFooter,
  clearTaskCategoryFromFooter,
  createCategoryViaSettingsUi,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

/**
 * Slower, UI-driven category flows (Settings → create category without API seed).
 * `task-assign-category` and `category-sidebar-filters` keep API seeding for speed and stability.
 */
test.describe('Categories: UI journey', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user creates a zone in Settings, assigns one task from the card, and sidebar filters behave', async ({
    page,
  }) => {
    const zoneName = 'UI Journey Zone';
    await createCategoryViaSettingsUi(page, zoneName);

    await addTaskWithTitle(page, 'In zone');
    await addTaskWithTitle(page, 'No zone');

    await assignTaskToCategoryFromFooter(page, 'In zone', zoneName);

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /Unassigned/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'No zone')).toBeVisible();
    await expect(taskCardByTitle(page, 'In zone')).toHaveCount(0);

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: new RegExp(zoneName)})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'In zone')).toBeVisible();

    await page
      .locator('.sidebar__categoriesNav')
      .getByRole('button', {name: /All categories/})
      .click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');
  });

  test('user creates a zone in Settings then clears assignment with “No category” on the card', async ({
    page,
  }) => {
    await createCategoryViaSettingsUi(page, 'UI Detach Zone');

    await addTaskWithTitle(page, 'Detach UI');

    await assignTaskToCategoryFromFooter(page, 'Detach UI', 'UI Detach Zone');
    const card = taskCardByTitle(page, 'Detach UI');
    await clearTaskCategoryFromFooter(page, 'Detach UI');

    await expect(card.locator('.taskCard__chip--category')).toHaveCount(0);
  });
});
