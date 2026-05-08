// Use the workspace base config rather than `@kitup/eslint-config/next`,
// which extends `eslint-config-next` and drags eslint v9 + its own
// `eslint-plugin-react` into the dep graph alongside the v8 one our
// `pnpm.overrides` pins. Both got loaded by ESLint and it refused to
// pick a winner. The base preset already covers React + hooks rules.
module.exports = {
  root: true,
  extends: ['@kitup/eslint-config'],
  ignorePatterns: ['node_modules', '.next', 'dist'],
};
