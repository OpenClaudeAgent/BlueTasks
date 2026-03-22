import {expect, test} from '@playwright/test';
import {
  addTaskWithTitle,
  AUTOSAVE_SETTLE_MS,
  firstCard,
  resetBoard,
  sleepMs,
  taskCardByTitle,
} from './task-flow-helpers';

/** Optional: `PLAYWRIGHT_E2E_BASE_URL=http://127.0.0.1:8899` when verifying against a fresh `npm run start` on that port. */
const e2eBaseUrl = process.env.PLAYWRIGHT_E2E_BASE_URL;
if (e2eBaseUrl) {
  test.use({baseURL: e2eBaseUrl});
}

test.describe('Task timer', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user starts timer and footer shows running state', async ({page}) => {
    const title = `E2E timer start ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await card.getByRole('button', {name: 'Start timer'}).click();

    await expect(card.getByRole('button', {name: 'Stop timer'})).toBeVisible();
    await expect(card.locator('.taskCard__timerLabel')).toBeVisible();
  });

  test('user stops timer and elapsed time is persisted after reload', async ({page}) => {
    const title = `E2E timer stop ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await card.getByRole('button', {name: 'Start timer'}).click();
    // While running, only timerStartedAt is persisted; timeSpentSeconds updates on stop.
    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          const rows = (await res.json()) as {
            title: string;
            timerStartedAt: string | null;
          }[];
          return rows.find((t) => t.title === title)?.timerStartedAt ?? '';
        },
        {timeout: 5000},
      )
      .toMatch(/^\d{4}-/);
    // Same wall-clock second → 0s delta; the app floors elapsed time to whole seconds.
    await sleepMs(1100);
    await card.getByRole('button', {name: 'Stop timer'}).click();
    await page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();
    await page.getByRole('button', {name: title}).click();

    const after = firstCard(page);
    await expect
      .poll(async () => {
        const res = await page.request.get('/api/tasks');
        const rows = (await res.json()) as {title: string; timeSpentSeconds: number}[];
        const row = rows.find((t) => t.title === title);
        return row?.timeSpentSeconds ?? 0;
      })
      .toBeGreaterThan(0);
    await expect(after.locator('.taskCard__timerLabel')).toBeVisible();
  });

  test('user edits tracked time manually and value persists after reload', async ({page}) => {
    const title = `E2E timer edit ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = taskCardByTitle(page, title);
    await card.getByRole('button', {name: 'Edit tracked time'}).click();
    const popover = page.locator('.footerPopover--timerEdit');
    await popover.getByRole('textbox', {name: 'Minutes'}).fill('2');
    const put = page.waitForResponse(
      (r) => /\/api\/tasks\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
    );
    await popover.getByRole('button', {name: 'Save'}).click();
    await put;
    await sleepMs(AUTOSAVE_SETTLE_MS);

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();
    await page.getByRole('button', {name: title}).click();

    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          const rows = (await res.json()) as {title: string; timeSpentSeconds: number}[];
          return rows.find((t) => t.title === title)?.timeSpentSeconds ?? -1;
        },
        {timeout: 5000},
      )
      .toBe(120);
  });
});
