import {expect, test} from '@playwright/test';
import {AUTOSAVE_SETTLE_MS, addTaskWithTitle, firstCard, resetBoard, taskCardByTitle} from './task-flow-helpers';

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
    await page.waitForTimeout(AUTOSAVE_SETTLE_MS + 600);

    await page.reload();
    await expect(page.getByRole('button', {name: 'Add task'})).toBeEnabled({timeout: 30_000});
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();
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

    await page.waitForTimeout(AUTOSAVE_SETTLE_MS);
    await expect
      .poll(async () => {
        const res = await page.request.get('/api/tasks');
        const rows = (await res.json()) as {title: string; checklistTotal: number}[];
        return rows.find((t) => t.title === title)?.checklistTotal ?? 0;
      })
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

    await page.waitForTimeout(AUTOSAVE_SETTLE_MS);

    const checkbox = card.locator('.editor__list--check .editor__listItem--unchecked').first();
    await checkbox.click();

    await expect(card.locator('.taskCard__footerLeft')).toContainText('%');
  });
});
