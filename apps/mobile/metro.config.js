const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so workspace package edits trigger reloads.
config.watchFolders = [monorepoRoot];

// Ensure Metro can find both the local and hoisted node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// pnpm symlinks: enable Metro's symlink-aware resolver so it can follow
// the `.pnpm/` indirection to find transitive deps like expo-modules-core.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
