const { getDefaultConfig } = require('expo/metro-config');

// Use ONLY the default Expo config - no customizations
const config = getDefaultConfig(__dirname);

// Add ONLY TypeScript support - nothing else
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;
