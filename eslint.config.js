import js from '@eslint/js';
import globals from 'globals';

/** Keep browser, Node, and generated files within their actual execution boundaries. */
export default [
  {
    ignores: [
      'node_modules/**',
      '.tmp/**',
      'output/**',
      'docs/api/**',
      'tests/types/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
