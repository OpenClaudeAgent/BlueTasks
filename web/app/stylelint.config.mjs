/** @type {import('stylelint').Config} */
const legacyThemeRules = {
  // Large legacy theme file (src/index.css): allow patterns without a full rewrite.
  'selector-class-pattern': null,
  'custom-property-pattern': null,
  'color-function-notation': null,
  'alpha-value-notation': null,
  'color-function-alias-notation': null,
  'color-hex-length': null,
  'custom-property-empty-line-before': null,
  'comment-empty-line-before': null,
  'declaration-empty-line-before': null,
  'value-keyword-case': null,
  'property-no-deprecated': null,
  'property-no-vendor-prefix': null,
  'declaration-property-value-keyword-no-deprecated': null,
  'declaration-property-value-no-unknown': null,
  'length-zero-no-unit': null,
  'shorthand-property-no-redundant-values': null,
  'no-descending-specificity': null,
  'font-family-no-missing-generic-family-keyword': null,
  'keyframes-name-pattern': null,
};

export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['**/dist/**', '**/coverage/**'],
  overrides: [
    {
      files: ['**/src/index.css'],
      rules: legacyThemeRules,
    },
    {
      files: ['**/src/lexicalMobileShell.css'],
      rules: legacyThemeRules,
    },
  ],
};
