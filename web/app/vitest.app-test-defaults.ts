import type {UserConfig} from 'vitest/config';

/** Shared Vitest `test` options for both default and coverage-gate configs. */
export const appVitestTestDefaults: NonNullable<UserConfig['test']> = {
  globals: false,
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  setupFiles: ['./src/test/setup.ts'],
  environment: 'node',
};
