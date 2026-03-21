/**
 * CI gate: ≥80% coverage on `src/lib/**` only (pure domain / task logic).
 * UI components stay in the default vitest.config coverage (lower bar).
 */
import {defineConfig, mergeConfig} from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: false,
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./src/test/setup.ts'],
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        reportsDirectory: './coverage-gate',
        include: ['src/lib/**/*.{ts,tsx}'],
        exclude: ['src/lib/**/*.test.ts', 'src/lib/**/*.test.tsx'],
        thresholds: {
          lines: 80,
          statements: 80,
          branches: 80,
          functions: 80,
        },
      },
    },
  }),
);
