import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    maxConcurrency: 1,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 48,
      },
    },
  },
});
