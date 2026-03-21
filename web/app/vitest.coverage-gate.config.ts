/**
 * CI gate: ≥80% on all executable app source under `src/**`, except:
 * - Test files and `src/test/` setup
 * - `src/types.ts` (type-only)
 * - `src/locales/**` (static JSON-like objects)
 * - `src/main.tsx` (Vite bootstrap)
 * - `src/i18n.ts` (side-effect init on import)
 * - `src/components/LexicalTaskEditor.tsx` (heavy Lexical UI; covered by Playwright `editor-toolbar.spec.ts`)
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
        // Lines/statements: regression guard for exercised behaviour. Branches/functions: interim floors —
        // extend only with BDD-named scenarios (docs/testing-strategy.md § Behaviour first), not filler tests.
        thresholds: {
          lines: 80,
          statements: 80,
          branches: 75,
          functions: 62,
        },
      },
    },
  }),
);
