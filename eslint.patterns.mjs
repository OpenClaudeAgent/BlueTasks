/**
 * Extra ESLint rules aligned with common practice (typescript-eslint docs, eslint-config-prettier).
 * Formatting stays in Prettier only — eslint-config-prettier must remain last in each flat config.
 *
 * Unicorn: only a few bug-prone / hygiene rules — not the full recommended preset (forEach/window/etc.
 * fight browser code and React patterns).
 */
import unicorn from 'eslint-plugin-unicorn';

export const patternPlugins = {unicorn};

const unicornHandPicked = {
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/no-useless-promise-resolve-reject': 'error',
  'unicorn/no-thenable': 'error',
  'unicorn/throw-new-error': 'error',
};

/** For `projectService` / typed lint blocks only (app + server `src` excluding excluded test globs). */
export const patternRules = {
  ...unicornHandPicked,
  eqeqeq: ['error', 'always', {null: 'ignore'}],
  'no-throw-literal': 'error',
  '@typescript-eslint/only-throw-error': 'error',
  '@typescript-eslint/no-import-type-side-effects': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {prefer: 'type-imports', fixStyle: 'separate-type-imports'},
  ],
};

/**
 * Vitest / integration files often sit outside `tsconfig` `include` — no type-aware @typescript-eslint rules.
 */
export const patternRulesNoType = {
  ...unicornHandPicked,
  eqeqeq: ['error', 'always', {null: 'ignore'}],
  'no-throw-literal': 'error',
};
