import {expect, test} from '@playwright/test';

import {deleteAllCategories, deleteAllTasks} from './api-helpers';
import {expectNoAxeViolations, goToPrimarySection} from './a11y-axe-helpers';
import {gotoWithEnglish} from './helpers';
import {
  addTaskWithTitle,
  createCategoryViaSettingsUi,
  firstCard,
  markTaskDoneAfterCollapse,
  resetBoard,
} from './task-flow-helpers';

test.describe('Accessibility (axe)', () => {
  test('Today board (empty) has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled();
    await expectNoAxeViolations(page);
  });

  test('All section has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await goToPrimarySection(page, /^All\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'All'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Upcoming section has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await goToPrimarySection(page, /^Upcoming\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'Upcoming'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Anytime section has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await goToPrimarySection(page, /^Anytime\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Done section (empty) has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await goToPrimarySection(page, /^Done\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'Done'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('unknown SPA route still serves shell without axe regressions', async ({page, request}) => {
    await deleteAllTasks(request);
    await deleteAllCategories(request);
    await gotoWithEnglish(page, '/this-route-does-not-exist');
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await expectNoAxeViolations(page);
  });

  test('Settings dialog (General) has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', {name: 'General'}).click();
    await expectNoAxeViolations(page);
  });

  test('Settings dialog (Categories, empty list) has no axe violations', async ({
    page,
    request,
  }) => {
    await resetBoard(page, request);
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Categories'}).click();
    await expect(dialog.getByText(/No categories yet/i)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Settings dialog (Categories with one category row) has no axe violations', async ({
    page,
    request,
  }) => {
    await resetBoard(page, request);
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'Categories'}).click();
    const categoryName = `A11y category ${Date.now()}`;
    const postCategory = page.waitForResponse(
      (r) =>
        r.url().includes('/api/categories') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
    );
    await dialog.getByPlaceholder('New category name').fill(categoryName);
    await dialog.getByRole('button', {name: 'Add'}).click();
    await postCategory;
    await expect(dialog.getByText(categoryName)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Today with expanded task card and editor has no axe violations', async ({
    page,
    request,
  }) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y editor ${Date.now()}`);
    await expect(firstCard(page).locator('.editor__toolbar')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Today with collapsed task card has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y collapsed ${Date.now()}`);
    const card = firstCard(page);
    await card.getByRole('button', {name: 'Collapse task'}).click();
    await expect(card.getByRole('button', {name: 'Expand task'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('task delete confirm alertdialog has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    const title = `A11y delete confirm ${Date.now()}`;
    await addTaskWithTitle(page, title);
    await firstCard(page).getByRole('button', {name: 'Delete', exact: true}).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toContainText(title);
    await expectNoAxeViolations(page);
  });

  test('date popover open on task card has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y date ${Date.now()}`);
    await firstCard(page).locator('.taskCard__datePill').click();
    await expect(page.locator('.datePopover__quickActions')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('footer category popover open has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await createCategoryViaSettingsUi(page, `A11y zone ${Date.now()}`);
    await addTaskWithTitle(page, `A11y category pop ${Date.now()}`);
    const card = firstCard(page);
    await card.locator('.taskCard__footerCategoryTrigger').click();
    await expect(page.locator('.footerPopover')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('footer estimate popover open has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y estimate ${Date.now()}`);
    await firstCard(page).locator('button[title="Time estimate"]').click();
    await expect(page.locator('.footerPopover')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('footer recurrence popover open has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y recurrence ${Date.now()}`);
    await firstCard(page).locator('button[title="Repeat"]').click();
    await expect(page.locator('.footerPopover')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('footer timer edit popover open has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y timer edit ${Date.now()}`);
    await firstCard(page).getByRole('button', {name: 'Edit tracked time'}).click();
    await expect(page.locator('.footerPopover--timerEdit')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('All section with open and done tasks has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    const openTitle = `A11y all open ${Date.now()}`;
    const doneTitle = `A11y all done ${Date.now()}`;
    await addTaskWithTitle(page, openTitle);
    await addTaskWithTitle(page, doneTitle);
    await markTaskDoneAfterCollapse(page, doneTitle);
    await goToPrimarySection(page, /^All\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'All'})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('Done section with a completed task has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    const title = `A11y done ${Date.now()}`;
    await addTaskWithTitle(page, title);
    await markTaskDoneAfterCollapse(page, title);
    await goToPrimarySection(page, /^Done\b/);
    await expect(page.getByRole('heading', {level: 1, name: 'Done'})).toBeVisible();
    await expect(page.getByRole('button', {name: title})).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('two tasks on Today list has no axe violations', async ({page, request}) => {
    await resetBoard(page, request);
    await addTaskWithTitle(page, `A11y multi a ${Date.now()}`);
    await addTaskWithTitle(page, `A11y multi b ${Date.now()}`);
    await expect(page.locator('article.taskCard')).toHaveCount(2);
    await expectNoAxeViolations(page);
  });
});
