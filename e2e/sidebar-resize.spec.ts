import {expect, test} from '@playwright/test';
import {
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from '../web/app/src/lib/sidebarLayout';
import {resetBoard} from './task-flow-helpers';

/**
 * Sidebar width UX (persisted in localStorage). Complements `useResizableSidebarWidth` unit tests.
 */
test.describe('Feature: Sidebar resize', () => {
  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
    // Default width for assertions (do not use addInitScript: it runs again on reload and would wipe persistence).
    await page.evaluate((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }, SIDEBAR_WIDTH_STORAGE_KEY);
    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
  });

  test.describe('Rule: persisted width', () => {
    test('Scenario: drag separator wider — aria-valuenow increases and matches after reload', async ({
      page,
    }) => {
      const handle = page.getByRole('separator', {name: 'Resize sidebar'});
      await expect(handle).toBeVisible();

      const before = Number(await handle.getAttribute('aria-valuenow'));
      expect(before).toBe(SIDEBAR_DEFAULT_WIDTH_PX);

      const box = await handle.boundingBox();
      expect(box).toBeTruthy();

      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 100, y);
      await page.mouse.up();

      await expect
        .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
        .toBeGreaterThan(before);

      const widened = Number(await handle.getAttribute('aria-valuenow'));

      await page.reload();
      await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});

      const afterReload = page.getByRole('separator', {name: 'Resize sidebar'});
      await expect
        .poll(async () => Number(await afterReload.getAttribute('aria-valuenow')))
        .toBe(widened);
    });
  });
});
