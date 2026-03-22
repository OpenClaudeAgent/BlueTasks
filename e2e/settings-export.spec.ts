import fs from 'node:fs/promises';

import {expect, test} from '@playwright/test';
import {gotoWithEnglish} from './helpers';

const SQLITE_MAGIC = Buffer.from('SQLite format 3\0');

test.describe('Settings: export database', () => {
  test('Scenario: user exports SQLite backup; file name and magic bytes match API contract', async ({
    page,
  }) => {
    await gotoWithEnglish(page, '/');
    await page.getByRole('button', {name: 'Settings'}).click();

    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', {name: 'General'}).click();

    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', {name: 'Export SQLite database'}).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bluetasks-\d{4}-\d{2}-\d{2}\.sqlite$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    const head = await fs.readFile(path!, {encoding: null});
    expect(head.subarray(0, SQLITE_MAGIC.length).equals(SQLITE_MAGIC)).toBe(true);
  });
});
