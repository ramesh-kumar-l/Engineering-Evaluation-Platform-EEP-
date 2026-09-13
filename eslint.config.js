// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // benchmark/fixtures/** are benchmark data, not EEP source: self-contained plain-JS/CJS
    // mini-repos an agent-under-test operates on, deliberately outside EEP's own TS/ESM/lint
    // conventions — see project-memory-bank/14-decisions.md ADR-006.
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'benchmark/fixtures/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
