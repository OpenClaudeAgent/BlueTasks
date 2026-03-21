import type {Page} from '@playwright/test';

const LANG_STORAGE_KEY = 'bluetasks.language';

/** Force English UI so roles and labels match `locales/en.ts` regardless of runner locale. */
export async function gotoWithEnglish(page: Page, path: string = '/'): Promise<void> {
  await page.addInitScript(
    (key) => {
      localStorage.setItem(key, 'en');
    },
    LANG_STORAGE_KEY,
  );
  await page.goto(path);
}
