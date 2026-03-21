import {expect, test} from '@playwright/test';
import {resetBoard} from './task-flow-helpers';

test.describe('Language', () => {
  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user switches to French and primary labels use FR locale', async ({page}) => {
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'General'}).click();
    await dialog.getByRole('group', {name: 'Language'}).getByRole('button', {name: 'FR'}).click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('heading', {level: 1, name: "Aujourd'hui"})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Paramètres'})).toBeVisible();
  });

  test('user switches back to English', async ({page}) => {
    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'General'}).click();
    await dialog.getByRole('group', {name: 'Language'}).getByRole('button', {name: 'FR'}).click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: 'Paramètres'}).click();
    const frDialog = page.getByRole('dialog', {name: 'Paramètres'});
    await frDialog.getByRole('button', {name: 'Général'}).click();
    await frDialog.getByRole('group', {name: 'Langue'}).getByRole('button', {name: 'EN'}).click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('heading', {level: 1, name: 'Today'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Settings'})).toBeVisible();
  });
});

test.describe('Import database', () => {
  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user imports a valid .sqlite export and sees restored tasks', async ({page, request}) => {
    const seed = await request.post('/api/tasks', {data: {title: 'IMPORT_MARKER'}});
    expect(seed.ok()).toBe(true);

    const exp = await request.get('/api/export/database');
    expect(exp.ok()).toBe(true);
    const buf = Buffer.from(await exp.body());

    const noise = await request.post('/api/tasks', {data: {title: 'IMPORT_NOISE'}});
    expect(noise.ok()).toBe(true);

    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'General'}).click();

    const importRes = page.waitForResponse(
      (r) => r.url().includes('/api/import/database') && r.request().method() === 'POST',
    );
    page.once('dialog', (d) => void d.accept());
    await page.locator('input[type=file]').setInputFiles({
      name: 'restore.sqlite',
      mimeType: 'application/vnd.sqlite3',
      buffer: buf,
    });
    const res = await importRes;
    expect(res.ok()).toBe(true);

    await page.keyboard.press('Escape');

    const list = await request.get('/api/tasks');
    const titles = ((await list.json()) as {title: string}[]).map((t) => t.title);
    expect(titles).toContain('IMPORT_MARKER');
    expect(titles).not.toContain('IMPORT_NOISE');
  });

  test('user cancels import confirm and data unchanged', async ({page, request}) => {
    const exp = await request.get('/api/export/database');
    expect(exp.ok()).toBe(true);
    const buf = Buffer.from(await exp.body());

    await request.post('/api/tasks', {data: {title: 'KEEP_ME'}});

    await page.getByRole('button', {name: 'Settings'}).click();
    const dialog = page.getByRole('dialog', {name: 'Settings'});
    await dialog.getByRole('button', {name: 'General'}).click();

    page.once('dialog', (d) => void d.dismiss());
    await page.locator('input[type=file]').setInputFiles({
      name: 'abort.sqlite',
      mimeType: 'application/vnd.sqlite3',
      buffer: buf,
    });

    const list = await request.get('/api/tasks');
    const titles = ((await list.json()) as {title: string}[]).map((t) => t.title);
    expect(titles).toContain('KEEP_ME');
  });
});
