import {defineConfig, devices} from '@playwright/test';

/**
 * E2E: production-shaped server (built SPA + API) on port 8787.
 * Locally, `webServer` runs `npm run build` then `npm run start` unless reuseExistingServer.
 */
export default defineConfig({
  testDir: './scenario',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
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
