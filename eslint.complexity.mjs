/**
 * Shared maintainability rules (SonarJS + core metrics) for app and server source.
 * Sonar "recommended" minus stylistic / third-party-deprecation noise; see docs/quality.md.
 */
import sonarjs from 'eslint-plugin-sonarjs';

const sonarRecommendedRules = sonarjs.configs.recommended.rules;

export const complexityPlugins = {sonarjs};

export const complexityRules = {
  ...sonarRecommendedRules,
  // React props / upstream deprecations — high churn, low signal for this repo
  'sonarjs/prefer-read-only-props': 'off',
  'sonarjs/deprecation': 'off',
  'sonarjs/no-nested-functions': 'off',
  'sonarjs/no-nested-conditional': 'off',
  'sonarjs/no-nested-template-literals': 'off',
  'sonarjs/void-use': 'off',
  'sonarjs/prefer-regexp-exec': 'off',
  'sonarjs/slow-regex': 'off',
  'sonarjs/redundant-type-aliases': 'off',
  'sonarjs/no-redundant-jump': 'off',
  // Allow more complexity in hooks / large UI trees before failing CI
  'sonarjs/cognitive-complexity': ['error', 30],
  // Duplicated UI strings: noisy with --max-warnings 0; rely on jscpd for copy-paste
  'sonarjs/no-duplicate-string': 'off',
  complexity: ['error', 30],
  'max-depth': ['error', 6],
};
