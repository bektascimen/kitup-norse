module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  // Apps run on a JS engine (Hermes/Node) for which `require`,
  // `module`, `__dirname`, etc. are real globals — without this the
  // workspace's `*.config.{js,cjs,ts}` files (metro, expo-target,
  // tailwind, sentry) lit up with no-undef errors under ESLint v8.
  env: { browser: true, node: true, es2022: true, jest: true },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Native config files written in CommonJS style are intentional;
    // don't penalise them for using `require()`.
    '@typescript-eslint/no-require-imports': 'off',
    // The codebase uses `any` deliberately at Supabase / native-bridge
    // boundaries where the upstream types are unhelpful or absent.
    '@typescript-eslint/no-explicit-any': 'off',
    // Plain quotes inside JSX strings read fine; the auto-escape rule
    // costs more than it saves for our editorial copy.
    'react/no-unescaped-entities': 'off',
    // Page-by-page paginators (e.g. translations sync) use `while (true)`
    // with explicit break conditions on purpose.
    'no-constant-condition': ['error', { checkLoops: false }],
  },
};
