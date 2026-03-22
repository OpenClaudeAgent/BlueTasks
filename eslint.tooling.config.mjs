import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import {patternPlugins, patternRulesNoType} from './eslint.patterns.mjs';

/** Root-level TS/JS not covered by web, server, or e2e workspaces. */
export default defineConfig([
  {
    files: ['eslint.tooling.config.mjs', 'eslint.e2e.config.mjs'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {...globals.node},
    },
    rules: {...patternRulesNoType},
  },
  {
    files: ['playwright.config.ts', 'contract/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {...globals.node},
    },
    rules: {...patternRulesNoType},
  },
  {
    files: ['scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    plugins: {...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {...globals.node},
    },
    rules: {...patternRulesNoType},
  },
  {
    files: ['scripts/**/*.cjs'],
    extends: [js.configs.recommended],
    plugins: {...patternPlugins},
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {...globals.node},
    },
    rules: {...patternRulesNoType},
  },
  eslintConfigPrettier,
]);
