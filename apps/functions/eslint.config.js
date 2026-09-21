// Flat config for eslint ^9.
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off', // used sparingly in tests
      'no-console': 'off',
    },
  },
  {
    ignores: ['lib/', 'node_modules/'],
  }
);
