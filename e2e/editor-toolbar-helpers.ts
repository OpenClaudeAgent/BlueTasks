import {expect, type Locator, type Page} from '@playwright/test';
import {addTaskWithTitle, firstCard} from './task-flow-helpers';

/** Single-toolbar-button flows: open editor, toggle format, type (optional), assert. */
export type SimpleToolbarCase = {
  name: string;
  buttonName: string;
  /** Typed after activating the format; omit for actions that need no text (e.g. divider). */
  typedText?: string;
  assert: (card: Locator) => Promise<void>;
};

export const SIMPLE_LEXICAL_TOOLBAR_CASES: SimpleToolbarCase[] = [
  {
    name: 'Bold formats typed text',
    buttonName: 'Bold',
    typedText: 'Accent text',
    assert: async (card) => {
      await expect(card.locator('.editor__text--bold')).toHaveText('Accent text');
    },
  },
  {
    name: 'Italic formats typed text',
    buttonName: 'Italic',
    typedText: 'Slanted',
    assert: async (card) => {
      await expect(card.locator('.editor__text--italic')).toHaveText('Slanted');
    },
  },
  {
    name: 'Heading turns line into H1',
    buttonName: 'Heading',
    typedText: 'Chapter title',
    assert: async (card) => {
      await expect(card.locator('.editor__heading--h1')).toHaveText('Chapter title');
    },
  },
  {
    name: 'Quote block from toolbar',
    buttonName: 'Quote',
    typedText: 'Citation line',
    assert: async (card) => {
      await expect(card.locator('.editor__quote')).toContainText('Citation line');
    },
  },
  {
    name: 'Code block from toolbar',
    buttonName: 'Code',
    typedText: 'const x = 1',
    assert: async (card) => {
      await expect(card.locator('.editor__codeBlock')).toContainText('const x = 1');
    },
  },
  {
    name: 'Divider inserts horizontal rule',
    buttonName: 'Divider',
    assert: async (card) => {
      await expect(card.locator('.editor__horizontalRule')).toBeVisible();
    },
  },
];

export async function runSimpleToolbarScenario(page: Page, c: SimpleToolbarCase): Promise<void> {
  const slug = c.name.replace(/\s+/g, '-').slice(0, 40);
  const title = `E2E ${slug} ${Date.now()}`;
  await addTaskWithTitle(page, title);

  const card = firstCard(page);
  await expect(card.locator('.editor__toolbar')).toBeVisible();
  const editor = card.locator('.editor__input');

  await editor.click();
  await card.getByRole('button', {name: c.buttonName}).click();
  if (c.typedText) {
    await editor.pressSequentially(c.typedText);
  }
  await c.assert(card);
}
