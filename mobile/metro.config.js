const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Pure product rules are shared; native dependencies remain in mobile/node_modules.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../shared")];
// Babel helpers for the shared sources resolve against the native app dependencies.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules"), ...(config.resolver.nodeModulesPaths ?? [])];
module.exports = config;
