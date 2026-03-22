import {expect, test} from '@playwright/test';
import {deleteAllAreas, deleteAllTasks} from './api-helpers';
import {addTaskWithTitle, taskCardByTitle} from './task-flow-helpers';
import {gotoWithEnglish} from './helpers';

/**
 * Delete is only available on the expanded card footer. These tests cover paths
 * that often differ from “add task → immediately delete” (task-lifecycle).
 */
test.describe('Task delete', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await deleteAllAreas(request);
    await deleteAllTasks(request);
    await gotoWithEnglish(page, '/');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
  });

  test('user deletes after collapsing and re-expanding the card', async ({page}) => {
    const title = `E2E delete after collapse ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = taskCardByTitle(page, title);
    await card.getByRole('button', {name: 'Collapse task'}).click();
    await card.getByRole('button', {name: 'Expand task'}).click();
    await expect(card.getByRole('button', {name: 'Delete', exact: true})).toBeVisible();

    await card.getByRole('button', {name: 'Delete', exact: true}).click();
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();
    const del = page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && r.url().includes('/api/tasks/') && r.ok(),
    );
    await confirmDialog.getByRole('button', {name: 'Delete', exact: true}).click();
    await del;

    await expect
      .poll(async () => {
        const res = await page.request.get('/api/tasks');
        const rows = (await res.json()) as {title: string}[];
        return rows.some((t) => t.title === title);
      })
      .toBe(false);

    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await expect(page.getByRole('button', {name: title})).toHaveCount(0);
    await expect(page.locator('.taskBoard__count')).toHaveText('0');
  });

  test('user cancels delete confirm and task remains in API', async ({page}) => {
    const title = `E2E delete cancel ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = taskCardByTitle(page, title);
    await card.getByRole('button', {name: 'Delete', exact: true}).click();
    await page.getByRole('alertdialog').getByRole('button', {name: 'Cancel'}).click();

    await expect(card.getByRole('textbox', {name: 'Task title'})).toBeVisible();
    const res = await page.request.get('/api/tasks');
    const rows = (await res.json()) as {title: string}[];
    expect(rows.some((t) => t.title === title)).toBe(true);
  });

  test('user dismisses delete dialog with Escape; task remains in API', async ({page}) => {
    const title = `E2E delete escape ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = taskCardByTitle(page, title);
    await card.getByRole('button', {name: 'Delete', exact: true}).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(title);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    await expect(card.getByRole('textbox', {name: 'Task title'})).toBeVisible();
    const res = await page.request.get('/api/tasks');
    const rows = (await res.json()) as {title: string}[];
    expect(rows.some((t) => t.title === title)).toBe(true);
  });
});
