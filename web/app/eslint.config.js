import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import {complexityPlugins, complexityRules} from '../../eslint.complexity.mjs';
import {patternPlugins, patternRules} from '../../eslint.patterns.mjs';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'coverage-gate']),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.{test,spec}.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {...complexityPlugins, ...patternPlugins},
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...patternRules,
      ...complexityRules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {checksVoidReturn: {attributes: false, arguments: false}},
      ],
      // Type-aware checks that catch real logic bugs (not the full strict preset)
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {ignoreArrowShorthand: true, ignoreVoidOperator: true},
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/*.spec.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'vitest.coverage-gate.config.ts',
      'vitest.app-test-defaults.ts',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {...globals.browser, ...globals.node},
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: {
      vitest,
      'testing-library': testingLibrary,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs['flat/react'].rules,
    },
  },
  eslintConfigPrettier,
]);
