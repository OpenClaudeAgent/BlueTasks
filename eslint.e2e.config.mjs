import js from '@eslint/js'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['e2e/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      playwright.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
])
