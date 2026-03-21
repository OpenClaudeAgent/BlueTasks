import {defineConfig, devices} from '@playwright/test';

/**
 * E2E: production-shaped server (built SPA + API) on port 8787.
 * Locally, `webServer` runs `npm run build` then `npm run start` unless reuseExistingServer.
 *
 * **Workers:** keep **1** by default. The server uses a single SQLite file (`.data/bluetasks.sqlite`);
 * multiple Playwright workers would run different tests against the same DB concurrently → races and
 * flaky failures. For faster CI wall time, use **sharding** (separate jobs / machines), not higher
 * `workers` on one process. Override only if you know what you are doing: `PLAYWRIGHT_WORKERS=2 npx playwright test`.
 */
const parsedWorkers = Number.parseInt(process.env.PLAYWRIGHT_WORKERS ?? '1', 10);
const workers = Number.isFinite(parsedWorkers) && parsedWorkers > 0 ? parsedWorkers : 1;

export default defineConfig({
  testDir: './scenario',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8787',
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:8787/api/tasks',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: '8787',
      NODE_ENV: 'production',
    },
  },
});
