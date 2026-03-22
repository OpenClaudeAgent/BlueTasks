import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';
import {defineConfig, globalIgnores} from 'eslint/config';

const typeCheckedSourceFiles = ['src/**/*.ts'];
const typeCheckedIgnores = [
  '**/*.test.ts',
  '**/*.integration.test.ts',
  'src/api.integration.test.helpers.ts',
];

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: typeCheckedSourceFiles,
    ignores: typeCheckedIgnores,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {security},
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...security.configs.recommended.rules,
      'security/detect-non-literal-fs-filename': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {checksVoidReturn: {attributes: false, arguments: false}},
      ],
    },
  },
  {
    files: [
      'src/**/*.test.ts',
      'src/**/*.integration.test.ts',
      'src/api.integration.test.helpers.ts',
      'vitest.config.ts',
      'vitest.coverage-gate.config.ts',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {vitest, security},
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  eslintConfigPrettier,
]);
