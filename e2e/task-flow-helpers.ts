import {setTimeout as delay} from 'node:timers/promises';

import {expect, type Locator, type Page} from '@playwright/test';
import type {APIRequestContext} from '@playwright/test';
import {deleteAllCategories, deleteAllTasks} from './api-helpers';
import {gotoWithEnglish} from './helpers';

/** Debounced save delay in the SPA + network slack */
export const AUTOSAVE_SETTLE_MS = 900;

/** Wall-clock wait (Playwright has no built-in sleep). Use when the UI counts whole seconds (e.g. task timer). */
export function sleepMs(ms: number): Promise<void> {
  return delay(ms);
}

export async function resetBoard(page: Page, request: APIRequestContext): Promise<void> {
  await deleteAllCategories(request);
  await deleteAllTasks(request);
  await gotoWithEnglish(page, '/');
  await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
}

/** Local calendar date `YYYY-MM-DD` (runner timezone — same as typical browser locale for E2E). */
export function localDateYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Quick capture field (sidebar): same accessible name in EN locale. */
export function quickCaptureTextbox(page: Page) {
  return page.getByRole('textbox', {name: /Capture a task/i});
}

/** Wait for POST /api/tasks from the SPA (quick capture or add task). */
export function waitForTaskCreateResponse(page: Page) {
  return page.waitForResponse(
    (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.status() === 201,
  );
}

/** POST task + save title; card stays expanded with editor visible. */
export async function addTaskWithTitle(page: Page, title: string): Promise<void> {
  const post = page.waitForResponse(
    (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST' && r.ok(),
  );
  await page.getByRole('button', {name: 'Add task'}).click();
  await post;

  const titleInput = page.getByRole('textbox', {name: 'Task title'});
  await titleInput.fill(title);
  const put = page.waitForResponse(
    (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
  );
  await titleInput.blur();
  await put;
}

export function firstCard(page: Page) {
  return page.locator('article.taskCard').first();
}

function titleInputValueSelector(title: string): string {
  const escaped = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `.taskCard__titleZone input.taskCard__titleInput[value="${escaped}"]`;
}

/** Card by title (collapsed title button or expanded title input). */
export function taskCardByTitle(page: Page, title: string) {
  const collapsed = page.locator('article.taskCard').filter({
    has: page.getByRole('button', {name: title, exact: true}),
  });
  const expanded = page.locator('article.taskCard').filter({
    has: page.locator(titleInputValueSelector(title)),
  });
  return collapsed.or(expanded);
}

/** API mutations (categories/tasks) do not update the SPA; reload so lists match the server. */
export async function reloadPageAfterApiSeed(page: Page): Promise<void> {
  await page.reload();
  await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
}

/**
 * Full UI flow: Settings → Categories → name → Add. Closes the dialog; sidebar shows the new category.
 * Uses English labels (same as {@link gotoWithEnglish}).
 */
export async function createCategoryViaSettingsUi(page: Page, name: string): Promise<{id: string}> {
  await page.getByRole('button', {name: 'Settings'}).click();
  const dialog = page.getByRole('dialog', {name: 'Settings'});
  await dialog.getByRole('button', {name: 'Categories'}).click();

  const postCategory = page.waitForResponse(
    (r) =>
      r.url().includes('/api/categories') && r.request().method() === 'POST' && r.status() === 201,
  );
  await dialog.getByPlaceholder('New category name').fill(name);
  await dialog.getByRole('button', {name: 'Add'}).click();
  const categoryRes = await postCategory;
  const created = (await categoryRes.json()) as {id: string; name: string};
  expect(created.name).toBe(name);

  await expect(dialog.getByText(name)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.locator('.sidebar__categoriesNav').getByRole('button', {name: new RegExp(name)}),
  ).toBeVisible();

  return {id: created.id};
}

export async function expandTaskCardIfCollapsed(page: Page, title: string): Promise<void> {
  const card = taskCardByTitle(page, title);
  const categoryTrigger = card.locator('.taskCard__footerCategoryTrigger');
  if (
    (await categoryTrigger.count()) === 0 ||
    !(await categoryTrigger.isVisible().catch(() => false))
  ) {
    const collapsedTitle = card.getByRole('button', {name: title, exact: true});
    if ((await collapsedTitle.count()) > 0) {
      await collapsedTitle.click();
    }
  }
}

function waitForTaskPutOk(page: Page) {
  return page.waitForResponse(
    (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
  );
}

/** Reload, open a primary section, expand the task whose collapsed title matches `title`. */
export async function reopenTaskByTitleAfterReload(
  page: Page,
  title: string,
  sectionNavButton: RegExp = /^Anytime\b/,
): Promise<void> {
  await page.reload();
  await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
  await page
    .getByRole('navigation', {name: 'Primary navigation'})
    .getByRole('button', {name: sectionNavButton})
    .click();
  await page.getByRole('button', {name: title}).click();
}

/** Collapse card, then mark done; waits for successful task PUT. */
export async function markTaskDoneAfterCollapse(page: Page, title: string): Promise<void> {
  const card = taskCardByTitle(page, title);
  await card.getByRole('button', {name: 'Collapse task'}).click();
  const markDonePut = waitForTaskPutOk(page);
  await card.getByRole('button', {name: 'Mark as done'}).click();
  await markDonePut;
}

export async function pollTaskChecklistTotalAtLeast(
  page: Page,
  title: string,
  atLeast: number,
  timeoutMs: number = AUTOSAVE_SETTLE_MS + 8000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const res = await page.request.get('/api/tasks');
        const rows = (await res.json()) as {title: string; checklistTotal: number}[];
        return rows.find((t) => t.title === title)?.checklistTotal ?? 0;
      },
      {timeout: timeoutMs},
    )
    .toBeGreaterThanOrEqual(atLeast);
}

export async function setCardDueDateTomorrow(page: Page, card: Locator): Promise<void> {
  await card.locator('.taskCard__datePill').click();
  const put = waitForTaskPutOk(page);
  await page.locator('.datePopover__quickActions').getByRole('button', {name: 'Tomorrow'}).click();
  await put;
}

export async function applyWeeklyRecurrenceOnCard(page: Page, card: Locator): Promise<void> {
  const putRec = waitForTaskPutOk(page);
  await card.locator('button[title="Repeat"]').click();
  await page.locator('.footerPopover').getByRole('button', {name: 'Weekly'}).click();
  await putRec;
}

/** English UI: Settings → General → Français (does not close the dialog). */
export async function switchLanguageToFrenchFromEnglishShell(page: Page): Promise<void> {
  await page.getByRole('button', {name: 'Settings'}).click();
  const dialog = page.getByRole('dialog', {name: 'Settings'});
  await dialog.getByRole('button', {name: 'General'}).click();
  await dialog
    .getByRole('group', {name: 'Language'})
    .getByRole('button', {name: 'Français'})
    .click();
}

/** Footer category popover → pick a category → wait for successful task PUT. */
export async function assignTaskToCategoryFromFooter(
  page: Page,
  title: string,
  categoryName: string,
): Promise<void> {
  const card = taskCardByTitle(page, title);
  await expandTaskCardIfCollapsed(page, title);
  await card.locator('.taskCard__footerCategoryTrigger').click();
  const put = waitForTaskPutOk(page);
  await page.locator('.footerPopover').getByRole('button', {name: categoryName}).click();
  await put;
}

/** Footer category popover → “No category” → wait for successful task PUT. */
export async function clearTaskCategoryFromFooter(page: Page, title: string): Promise<void> {
  const card = taskCardByTitle(page, title);
  await card.locator('.taskCard__footerCategoryTrigger').click();
  const put = waitForTaskPutOk(page);
  await page.locator('.footerPopover').getByRole('button', {name: 'No category'}).click();
  await put;
}
