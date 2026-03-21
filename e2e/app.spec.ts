import {test, expect} from '@playwright/test';

test.describe('Feature: BlueTasks shell', () => {
  test.describe('Scenario: Fresh install responds', () => {
    test('given the server is up, when the client requests tasks, then the API returns 200 JSON', async ({request}) => {
      const res = await request.get('/api/tasks');
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type'] ?? '').toMatch(/application\/json/i);
      const body: unknown = await res.json();
      expect(Array.isArray(body)).toBe(true);
      for (const row of body as object[]) {
        expect(row).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          status: expect.stringMatching(/^(pending|completed)$/),
        });
      }
    });
  });

  test.describe('Scenario: User opens the app in a browser', () => {
    test('given a built SPA, when they load /, then the root mounts and the shell is visible', async ({page}) => {
      await page.goto('/');
      await expect(page.locator('#root')).toBeAttached();
      await expect(page.getByRole('heading', {level: 1, name: /Today|Aujourd/i})).toBeVisible();
    });
  });
});
