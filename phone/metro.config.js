const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8082, // Use port 8082 to avoid conflict with backend on 8081
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
