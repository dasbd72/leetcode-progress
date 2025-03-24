// eslint.config.js
import angularEslint from '@angular-eslint/eslint-plugin';

import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.angular/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: await import('@typescript-eslint/parser'),
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@angular-eslint': angularEslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...angularEslint.configs.recommended.rules,
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': await import('@angular-eslint/eslint-plugin-template'),
    },
    languageOptions: {
      parser: await import('@angular-eslint/template-parser'),
    },
    rules: {},
  },
  // Optional: override for Prettier to disable conflicting ESLint rules
  eslintConfigPrettier,
];
