import {expect, test} from '@playwright/test';
import {addTaskWithTitle, firstCard, resetBoard} from './task-flow-helpers';

test.describe('End-to-end: Lexical toolbar', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('Bold formats typed text', async ({page}) => {
    const title = `E2E editor bold ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    await expect(card.locator('.editor__toolbar')).toBeVisible();
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Bold'}).click();
    await editor.pressSequentially('Accent text');

    await expect(card.locator('.editor__text--bold')).toHaveText('Accent text');
  });

  test('Italic formats typed text', async ({page}) => {
    const title = `E2E editor italic ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Italic'}).click();
    await editor.pressSequentially('Slanted');

    await expect(card.locator('.editor__text--italic')).toHaveText('Slanted');
  });

  test('Heading turns line into H1', async ({page}) => {
    const title = `E2E editor heading ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Heading'}).click();
    await editor.pressSequentially('Chapter title');

    await expect(card.locator('.editor__heading--h1')).toHaveText('Chapter title');
  });

  test('Bullet list from toolbar', async ({page}) => {
    const title = `E2E editor bullets ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Bullet list'}).click();
    await editor.pressSequentially('Alpha');
    await editor.press('Enter');
    await editor.pressSequentially('Beta');

    const list = card.locator('.editor__list--unordered:not(.editor__list--check)');
    await expect(list).toBeVisible();
    await expect(list.locator('.editor__listItem')).toHaveCount(2);
    await expect(list.locator('.editor__listItem').nth(0)).toContainText('Alpha');
    await expect(list.locator('.editor__listItem').nth(1)).toContainText('Beta');
  });

  test('Checklist from toolbar', async ({page}) => {
    const title = `E2E editor checklist ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Checklist'}).click();
    await editor.pressSequentially('Buy milk');

    const list = card.locator('.editor__list--check');
    await expect(list).toBeVisible();
    await expect(list.locator('.editor__listItem')).toHaveCount(1);
    await expect(list.locator('.editor__listItem').first()).toContainText('Buy milk');
  });

  test('Insert table adds a 2×2 grid', async ({page}) => {
    const title = `E2E editor table ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Insert table'}).click();

    const table = card.locator('.editor__table');
    await expect(table).toBeVisible();
    await expect(card.locator('.editor__tableCell, .editor__tableCellHeader')).toHaveCount(4);
  });

  test('Typing [] then space starts a checklist line (markdown shortcut)', async ({page}) => {
    const title = `E2E editor md check ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await editor.pressSequentially('[] ');
    await editor.pressSequentially('From markdown');

    const list = card.locator('.editor__list--check');
    await expect(list).toBeVisible();
    await expect(list.locator('.editor__listItem').first()).toContainText('From markdown');
  });

  test('Quote block from toolbar', async ({page}) => {
    const title = `E2E editor quote ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Quote'}).click();
    await editor.pressSequentially('Citation line');

    await expect(card.locator('.editor__quote')).toContainText('Citation line');
  });

  test('Code block from toolbar', async ({page}) => {
    const title = `E2E editor code ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Code'}).click();
    await editor.pressSequentially('const x = 1');

    await expect(card.locator('.editor__codeBlock')).toContainText('const x = 1');
  });

  test('Divider inserts horizontal rule', async ({page}) => {
    const title = `E2E editor hr ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Divider'}).click();

    await expect(card.locator('.editor__horizontalRule')).toBeVisible();
  });
});
