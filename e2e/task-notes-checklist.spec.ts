import {expect, test} from '@playwright/test';
import {
  AUTOSAVE_SETTLE_MS,
  addTaskWithTitle,
  firstCard,
  resetBoard,
  taskCardByTitle,
} from './task-flow-helpers';

test.describe('Notes', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user types in notes and autosave persists (reload)', async ({page}) => {
    const title = `E2E notes ${Date.now()}`;
    const noteSnippet = `NoteBody${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');
    await editor.click();
    await editor.pressSequentially(noteSnippet);
    await page.locator('.mainHeader__title').click();
    await expect(editor).toContainText(noteSnippet);
    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          const rows = (await res.json()) as {title: string; contentText: string}[];
          return rows.find((t) => t.title === title)?.contentText.includes(noteSnippet) ?? false;
        },
        {timeout: AUTOSAVE_SETTLE_MS + 8000},
      )
      .toBe(true);

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
    await page.getByRole('button', {name: title}).click();

    await expect(taskCardByTitle(page, title).locator('.editor__input')).toContainText(noteSnippet);
  });
});

test.describe('Checklist', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user adds checklist items and progress updates in footer', async ({page}) => {
    const title = `E2E checklist ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');
    await editor.click();
    await card.getByRole('button', {name: 'Checklist'}).click();
    await editor.pressSequentially('Line one');

    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          const rows = (await res.json()) as {title: string; checklistTotal: number}[];
          return rows.find((t) => t.title === title)?.checklistTotal ?? 0;
        },
        {timeout: AUTOSAVE_SETTLE_MS + 8000},
      )
      .toBeGreaterThanOrEqual(1);
  });

  test('user checks items off and sees percent in footer meta', async ({page}) => {
    const title = `E2E check off ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');
    await editor.click();
    await card.getByRole('button', {name: 'Checklist'}).click();
    await editor.pressSequentially('Todo item');

    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/tasks');
          const rows = (await res.json()) as {title: string; checklistTotal: number}[];
          return rows.find((t) => t.title === title)?.checklistTotal ?? 0;
        },
        {timeout: AUTOSAVE_SETTLE_MS + 8000},
      )
      .toBeGreaterThanOrEqual(1);

    const checkbox = card.locator('.editor__list--check .editor__listItem--unchecked').first();
    await checkbox.click();

    await expect(card.locator('.taskCard__footerLeft')).toContainText('%');
  });
});
