import {expect, test} from '@playwright/test';
import {quickCaptureTextbox, resetBoard, taskCardByTitle, waitForTaskCreateResponse} from './task-flow-helpers';

test.describe('Quick capture', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('user types in quick capture and submits; task appears in current section', async ({page}) => {
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Anytime\b/}).click();
    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();

    const title = `QC ${Date.now()}`;
    const field = quickCaptureTextbox(page);
    await expect(field).toBeVisible();
    const created = waitForTaskCreateResponse(page);
    await field.fill(title);
    await page.keyboard.press('Enter');
    const res = await created;
    expect(res.status()).toBe(201);
    const row: unknown = await res.json();
    expect(row).toMatchObject({title, status: 'pending'});

    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();
    await expect(taskCardByTitle(page, title)).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('user quick-captures while on Upcoming and task lands with expected default date rules', async ({page}) => {
    await page.getByRole('navigation', {name: 'Primary navigation'}).getByRole('button', {name: /^Upcoming\b/}).click();
    await expect(page.getByRole('heading', {level: 1, name: 'Upcoming'})).toBeVisible();

    const title = `QC up ${Date.now()}`;
    const field = quickCaptureTextbox(page);
    const created = waitForTaskCreateResponse(page);
    await field.fill(title);
    await page.keyboard.press('Enter');
    const res = await created;
    expect(res.status()).toBe(201);
    const row = (await res.json()) as {taskDate: string | null};
    expect(row.taskDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await expect(taskCardByTitle(page, title)).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(
      taskCardByTitle(page, title).locator('.taskCard__datePill'),
    ).not.toHaveClass(/taskCard__datePill--empty/);
  });
});
