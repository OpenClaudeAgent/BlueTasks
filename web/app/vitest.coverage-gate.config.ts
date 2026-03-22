/**
 * CI coverage gate: `src/**` except bootstrap, i18n, types, locales, tests, Lexical (Playwright).
 */
import {defineConfig, mergeConfig} from 'vitest/config';
import viteConfig from './vite.config';
import {appVitestTestDefaults} from './vitest.app-test-defaults';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      ...appVitestTestDefaults,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: './coverage-gate',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/test/**',
          'src/types.ts',
          'src/locales/**',
          'src/main.tsx',
          'src/i18n.ts',
          'src/components/LexicalTaskEditor.tsx',
        ],
        thresholds: {
          lines: 80,
          statements: 80,
          branches: 75,
          functions: 80,
        },
      },
    },
  }),
);
