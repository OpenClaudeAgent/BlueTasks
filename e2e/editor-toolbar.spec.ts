import {expect, test} from '@playwright/test';
import {addTaskWithTitle, firstCard, resetBoard} from './task-flow-helpers';
import {runSimpleToolbarScenario, SIMPLE_LEXICAL_TOOLBAR_CASES} from './editor-toolbar-helpers';

test.describe('End-to-end: Lexical toolbar', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  for (const c of SIMPLE_LEXICAL_TOOLBAR_CASES) {
    /* Assertions live in runSimpleToolbarScenario → c.assert */
    // eslint-disable-next-line playwright/expect-expect -- delegated to helper
    test(c.name, async ({page}) => {
      await runSimpleToolbarScenario(page, c);
    });
  }

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

  test('Checklist: Enter on empty markdown line adds a second checkbox row', async ({page}) => {
    const title = `E2E editor check enter ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await editor.pressSequentially('[] ');
    await editor.press('Enter');
    await editor.pressSequentially('Ligne deux');

    const list = card.locator('.editor__list--check');
    await expect(list).toBeVisible();
    await expect(list.locator('.editor__listItem')).toHaveCount(2);
    await expect(list.locator('.editor__listItem').nth(1)).toContainText('Ligne deux');
  });

  test('Checklist: Tab after new line nests a sub-item under the previous row', async ({page}) => {
    const title = `E2E editor check tab ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await card.getByRole('button', {name: 'Checklist'}).click();
    await editor.pressSequentially('Parent');
    await editor.press('Enter');
    await editor.press('Tab');
    await editor.pressSequentially('Enfant');

    const rootList = card.locator('.editor__list--check').first();
    await expect(rootList).toBeVisible();
    await expect(rootList.locator(':scope > .editor__listItem')).toHaveCount(2);
    await expect(editor.getByRole('checkbox')).toHaveCount(2);
    const nestedList = card.locator('.editor__list--check').nth(1);
    await expect(nestedList).toBeVisible();
    await expect(nestedList.locator('.editor__listItem').first()).toContainText('Enfant');
  });

  test('Checklist: markdown Enter then [] then Tab keeps two visible checkboxes', async ({page}) => {
    const title = `E2E editor md check tab ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await editor.pressSequentially('[] ');
    await editor.press('Enter');
    await editor.pressSequentially('[] ');
    await editor.press('Tab');
    await editor.pressSequentially('Sous-ligne');

    const rootList = card.locator('.editor__list--check').first();
    await expect(rootList).toBeVisible();
    await expect(rootList.locator(':scope > .editor__listItem')).toHaveCount(2);
    await expect(editor.getByRole('checkbox')).toHaveCount(2);
    const nestedList = card.locator('.editor__list--check').nth(1);
    await expect(nestedList).toBeVisible();
    await expect(nestedList.locator('.editor__listItem').first()).toContainText('Sous-ligne');
  });

  test('Typing --- then space inserts horizontal rule (markdown shortcut)', async ({page}) => {
    const title = `E2E editor md hr ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');

    await editor.click();
    await editor.pressSequentially('--- ');

    await expect(card.locator('.editor__horizontalRule')).toBeVisible();
  });

  test('Typing a URL then space turns it into a link', async ({page}) => {
    const title = `E2E editor autolink ${Date.now()}`;
    await addTaskWithTitle(page, title);

    const card = firstCard(page);
    const editor = card.locator('.editor__input');
    const url = 'https://example.com/e2e-autolink';

    await editor.click();
    await editor.pressSequentially(`${url} `);

    const anchor = card.locator(`a.editor__links[href="${url}"]`);
    await expect(anchor).toBeVisible();
    await expect(anchor).toHaveText(url);
  });
});
