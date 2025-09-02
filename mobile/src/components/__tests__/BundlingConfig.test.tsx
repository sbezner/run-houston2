/**
 * Bundling Configuration Tests
 * Purpose: Catch Metro/Babel/Expo configuration issues before they cause runtime failures
 */

import { Platform } from 'react-native';

describe('Bundling Configuration Tests', () => {
  test('Metro configuration should be valid', () => {
    // Test that Metro can resolve our configuration
    const metroConfig = require('../../../metro.config.js');
    expect(metroConfig).toBeDefined();
    expect(typeof metroConfig).toBe('object');
  });

  test('Babel configuration should be valid', () => {
    // Test that Babel configuration is properly structured
    const babelConfig = require('../../../babel.config.js');
    expect(babelConfig).toBeDefined();
    
    // Test that it's a function (Expo style)
    expect(typeof babelConfig).toBe('function');
    
    // Test that it returns valid configuration
    const config = babelConfig({ cache: () => {} });
    expect(config.presets).toBeDefined();
    expect(Array.isArray(config.presets)).toBe(true);
  });

  test('Expo configuration should be valid', () => {
    // Test that app.json is properly configured
    const appConfig = require('../../../app.json');
    expect(appConfig.expo).toBeDefined();
    expect(appConfig.expo.name).toBe('mobile_new');
    expect(appConfig.expo.version).toBe('1.0.0');
  });

  test('Package.json should have correct dependencies', () => {
    // Test that essential dependencies are present
    const packageJson = require('../../../package.json');
    
    // Core dependencies
    expect(packageJson.dependencies.expo).toBeDefined();
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies['react-native']).toBeDefined();
    
    // Dev dependencies for testing
    expect(packageJson.devDependencies.jest).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
  });

  test('TypeScript configuration should be valid', () => {
    // Test that tsconfig.json extends Expo base
    const tsConfig = require('../../../tsconfig.json');
    expect(tsConfig.extends).toBe('expo/tsconfig.base');
    expect(tsConfig.compilerOptions.strict).toBe(true);
  });

  test('Platform-specific configurations should be valid', () => {
    // Test that platform-specific code can be imported
    if (Platform.OS === 'ios') {
      // iOS-specific imports should work
      expect(() => require('react-native-modal-datetime-picker')).not.toThrow();
    }
    
    if (Platform.OS === 'android') {
      // Android-specific imports should work
      expect(() => require('react-native-gesture-handler')).not.toThrow();
    }
  });

  test('Navigation dependencies should be properly configured', () => {
    // Test that navigation packages can be imported
    expect(() => require('@react-navigation/native')).not.toThrow();
    expect(() => require('@react-navigation/stack')).not.toThrow();
    expect(() => require('@react-navigation/bottom-tabs')).not.toThrow();
  });

  test('Expo modules should be properly configured', () => {
    // Test that Expo modules can be imported
    expect(() => require('expo-location')).not.toThrow();
    expect(() => require('expo-status-bar')).not.toThrow();
  });
});
