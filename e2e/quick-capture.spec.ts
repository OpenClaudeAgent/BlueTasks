import {expect, test} from '@playwright/test';
import {expectApiTaskRow} from './contract-expectations';
import {
  quickCaptureTextbox,
  resetBoard,
  taskCardByTitle,
  waitForTaskCreateResponse,
} from './task-flow-helpers';

test.describe('Feature: Quick capture (E2E)', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page, request}) => {
    await resetBoard(page, request);
  });

  test('Scenario: Anytime — user submits quick capture; task appears with valid API row', async ({
    page,
  }) => {
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Anytime\b/})
      .click();
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
    expectApiTaskRow(row);

    await expect(page.getByRole('heading', {level: 1, name: 'Anytime'})).toBeVisible();
    await expect(taskCardByTitle(page, title)).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
  });

  test('Scenario: Upcoming — user quick-captures; API returns dated row and pill is set', async ({
    page,
  }) => {
    await page
      .getByRole('navigation', {name: 'Primary navigation'})
      .getByRole('button', {name: /^Upcoming\b/})
      .click();
    await expect(page.getByRole('heading', {level: 1, name: 'Upcoming'})).toBeVisible();

    const title = `QC up ${Date.now()}`;
    const field = quickCaptureTextbox(page);
    const created = waitForTaskCreateResponse(page);
    await field.fill(title);
    await page.keyboard.press('Enter');
    const res = await created;
    expect(res.status()).toBe(201);
    const row: unknown = await res.json();
    expectApiTaskRow(row);
    expect((row as {taskDate: string | null}).taskDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await expect(taskCardByTitle(page, title)).toBeVisible();
    await expect(page.locator('.taskBoard__count')).toHaveText('1');
    await expect(taskCardByTitle(page, title).locator('.taskCard__datePill')).not.toHaveClass(
      /taskCard__datePill--empty/,
    );
  });
});
