import {expect, type APIResponse} from '@playwright/test';

export function expectJsonContentType(res: APIResponse): void {
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toMatch(/application\/json/i);
}
