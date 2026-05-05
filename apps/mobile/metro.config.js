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

// pnpm uses non-flat node_modules; disable hierarchical lookup so Metro
// only walks the explicit nodeModulesPaths above.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
