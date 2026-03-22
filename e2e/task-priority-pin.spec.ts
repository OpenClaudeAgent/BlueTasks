import {expect, test} from '@playwright/test';
import {addTaskWithTitle, firstCard, resetBoard} from './task-flow-helpers';

test.describe('Task priority', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user cycles priority from normal to high (footer control)', async ({page}) => {
    const title = `E2E priority ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await expect(card.locator('.taskCard__footerMeta--priority-normal')).toBeVisible();

    await card.locator('.taskCard__footerPriority').click();

    await expect(card.locator('.taskCard__footerMeta--priority-high')).toBeVisible();
    await expect(card.locator('.taskCard__footerMeta--priority-high')).toHaveText('High');
  });

  test('user cycles priority through low → normal → high and sees labels', async ({page}) => {
    const title = `E2E priority cycle ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const btn = firstCard(page).locator('.taskCard__footerPriority');
    await btn.click();
    await expect(firstCard(page).locator('.taskCard__footerMeta--priority-high')).toBeVisible();
    await btn.click();
    await expect(firstCard(page).locator('.taskCard__footerMeta--priority-low')).toBeVisible();
    await btn.click();
    await expect(firstCard(page).locator('.taskCard__footerMeta--priority-normal')).toBeVisible();
  });
});

test.describe('Task pin', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user pins a task and it shows pinned state / sort', async ({page}) => {
    const title = `E2E pin ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const pinBtn = firstCard(page).locator('button[title="Pin to top"]');
    await pinBtn.click();

    await expect(firstCard(page).locator('button[title="Unpin"]')).toHaveClass(/is-active/);
  });

  test('user unpins a previously pinned task', async ({page}) => {
    const title = `E2E unpin ${Date.now()}`;
    await addTaskWithTitle(page, title);

    await firstCard(page).locator('button[title="Pin to top"]').click();
    const unpin = firstCard(page).locator('button[title="Unpin"]');
    await expect(unpin).toHaveClass(/is-active/);
    await unpin.click();
    await expect(firstCard(page).locator('button[title="Pin to top"]')).not.toHaveClass(
      /is-active/,
    );
  });
});
