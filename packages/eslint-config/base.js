/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
