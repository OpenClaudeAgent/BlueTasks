import {setTimeout as delay} from 'node:timers/promises';

import {expect, type Page} from '@playwright/test';
import type {APIRequestContext} from '@playwright/test';
import {deleteAllAreas, deleteAllTasks} from './api-helpers';
import {gotoWithEnglish} from './helpers';

/** Debounced save delay in the SPA + network slack */
export const AUTOSAVE_SETTLE_MS = 900;

/** Wall-clock wait (Playwright has no built-in sleep). Use when the UI counts whole seconds (e.g. task timer). */
export function sleepMs(ms: number): Promise<void> {
  return delay(ms);
}

export async function resetBoard(page: Page, request: APIRequestContext): Promise<void> {
  await deleteAllAreas(request);
  await deleteAllTasks(request);
  await gotoWithEnglish(page, '/');
  await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
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

/** API mutations (areas/tasks) do not update the SPA; reload so lists match the server. */
export async function reloadPageAfterApiSeed(page: Page): Promise<void> {
  await page.reload();
  await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
}

export async function expandTaskCardIfCollapsed(page: Page, title: string): Promise<void> {
  const card = taskCardByTitle(page, title);
  const areaTrigger = card.locator('.taskCard__footerAreaTrigger');
  if ((await areaTrigger.count()) === 0 || !(await areaTrigger.isVisible().catch(() => false))) {
    const collapsedTitle = card.getByRole('button', {name: title, exact: true});
    if ((await collapsedTitle.count()) > 0) {
      await collapsedTitle.click();
    }
  }
}
