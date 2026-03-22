import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import {patternPlugins, patternRulesNoType} from './eslint.patterns.mjs';

export default defineConfig([
  {
    files: ['e2e/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      playwright.configs['flat/recommended'],
    ],
    plugins: {...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {...globals.node},
    },
    rules: {
      ...patternRulesNoType,
    },
  },
  eslintConfigPrettier,
]);
