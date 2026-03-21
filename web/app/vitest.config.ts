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
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        include: [
          'src/lib/**/*.{ts,tsx}',
          'src/components/SettingsDialog.tsx',
          'src/components/TaskCard.tsx',
          'src/components/LanguageSwitcher.tsx',
        ],
        exclude: [
          'src/lib/**/*.test.ts',
          'src/lib/**/*.test.tsx',
          'src/components/SettingsDialog.test.tsx',
          'src/components/TaskCard.test.tsx',
          'src/components/LanguageSwitcher.test.tsx',
        ],
        thresholds: {
          lines: 55,
          statements: 55,
          branches: 44,
          functions: 48,
        },
      },
    },
  }),
);
