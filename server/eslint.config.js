import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import {complexityPlugins, complexityRules} from '../eslint.complexity.mjs';
import {patternPlugins, patternRules, patternRulesNoType} from '../eslint.patterns.mjs';
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
    plugins: {security, ...complexityPlugins, ...patternPlugins},
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
      ...patternRules,
      ...complexityRules,
      'security/detect-non-literal-fs-filename': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {checksVoidReturn: {attributes: false, arguments: false}},
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {ignoreArrowShorthand: true, ignoreVoidOperator: true},
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
    plugins: {vitest, security, ...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      ...patternRulesNoType,
      ...vitest.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  eslintConfigPrettier,
]);
