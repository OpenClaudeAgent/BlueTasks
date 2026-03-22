import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  assignTaskToAreaFromFooter,
  clearTaskAreaFromFooter,
  createAreaViaSettingsUi,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

/**
 * Slower, UI-driven area flows (Settings → create area without API seed).
 * `task-assign-area` and `area-sidebar-filters` keep API seeding for speed and stability.
 */
test.describe('Areas: UI journey', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user creates a zone in Settings, assigns one task from the card, and sidebar filters behave', async ({page}) => {
    const zoneName = 'UI Journey Zone';
    await createAreaViaSettingsUi(page, zoneName);

    await addTaskWithTitle(page, 'In zone');
    await addTaskWithTitle(page, 'No zone');

    await assignTaskToAreaFromFooter(page, 'In zone', zoneName);

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /Unassigned/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'No zone')).toBeVisible();
    await expect(taskCardByTitle(page, 'In zone')).toHaveCount(0);

    await page.locator('.sidebar__areasNav').getByRole('button', {name: new RegExp(zoneName)}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, 'In zone')).toBeVisible();

    await page.locator('.sidebar__areasNav').getByRole('button', {name: /All areas/}).click();
    await expect(page.locator('.taskBoard__count')).toHaveText('2');
  });

  test('user creates a zone in Settings then clears assignment with “No area” on the card', async ({page}) => {
    await createAreaViaSettingsUi(page, 'UI Detach Zone');

    await addTaskWithTitle(page, 'Detach UI');

    await assignTaskToAreaFromFooter(page, 'Detach UI', 'UI Detach Zone');
    const card = taskCardByTitle(page, 'Detach UI');
    await clearTaskAreaFromFooter(page, 'Detach UI');

    await expect(card.locator('.taskCard__chip--area')).toHaveCount(0);
  });
});
