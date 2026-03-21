import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.ts'],
    ignores: ['**/*.test.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {vitest},
    rules: {...vitest.configs.recommended.rules},
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
  },
]);
