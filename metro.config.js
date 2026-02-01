const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix "import.meta outside module" error on web
// See: https://github.com/expo/expo/issues/36384
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
