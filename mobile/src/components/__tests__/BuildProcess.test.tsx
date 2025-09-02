/**
 * Build Process Tests
 * Purpose: Validate that the app can actually build and bundle without errors
 */

describe('Build Process Tests', () => {
  test('Metro bundler configuration should be valid', () => {
    // Test Metro configuration structure
    const metroConfig = require('../../../metro.config.js');
    
    // Check resolver configuration
    expect(metroConfig.resolver).toBeDefined();
    expect(metroConfig.resolver.sourceExts).toContain('ts');
    expect(metroConfig.resolver.sourceExts).toContain('tsx');
    expect(metroConfig.resolver.resolverMainFields).toContain('react-native');
    
    // Check transformer configuration
    expect(metroConfig.transformer).toBeDefined();
    expect(metroConfig.transformer.getTransformOptions).toBeDefined();
  });

  test('Babel preset should be Expo-compatible', () => {
    const babelConfig = require('../../../babel.config.js');
    const config = babelConfig({ cache: () => {} });
    
    // Should use babel-preset-expo
    expect(config.presets).toHaveLength(1);
    expect(config.presets[0][0]).toBe('babel-preset-expo');
    
    // Should have jsxImportSource configured
    expect(config.presets[0][1]).toEqual({ jsxImportSource: 'react' });
  });

  test('Dependencies should not have conflicts', () => {
    const packageJson = require('../../../package.json');
    
    // Check for removed incompatible presets
    const devDeps = packageJson.devDependencies || {};
    expect(devDeps['@babel/preset-env']).toBeUndefined();
    expect(devDeps['@babel/preset-react']).toBeUndefined();
    expect(devDeps['@babel/preset-typescript']).toBeUndefined();
    
    // Check for required dependencies
    expect(packageJson.dependencies['@babel/core']).toBeDefined();
  });

  test('TypeScript configuration should support React Native', () => {
    const tsConfig = require('../../../tsconfig.json');
    
    // Should extend Expo base config
    expect(tsConfig.extends).toBe('expo/tsconfig.base');
    
    // Should have strict mode enabled
    expect(tsConfig.compilerOptions.strict).toBe(true);
  });

  test('App configuration should be valid for building', () => {
    const appConfig = require('../../../app.json');
    
    // Required fields for building
    expect(appConfig.expo.name).toBeDefined();
    expect(appConfig.expo.slug).toBeDefined();
    expect(appConfig.expo.version).toBeDefined();
    
    // Platform support
    expect(appConfig.expo.ios).toBeDefined();
    expect(appConfig.expo.android).toBeDefined();
  });

  test('Critical packages should be importable', () => {
    // Test that core packages can be imported without errors
    expect(() => require('react')).not.toThrow();
    expect(() => require('react-native')).not.toThrow();
    
    // Test that our custom components can be imported
    expect(() => require('../DateSheet')).not.toThrow();
    expect(() => require('../RaceCard')).not.toThrow();
    expect(() => require('../FilterSheet')).not.toThrow();
  });

  test('Navigation setup should be valid', () => {
    // Test navigation dependencies
    const navigation = require('@react-navigation/native');
    expect(navigation).toBeDefined();
    
    // Test that navigation components exist
    expect(() => require('@react-navigation/stack')).not.toThrow();
    expect(() => require('@react-navigation/bottom-tabs')).not.toThrow();
  });

  test('Expo modules should be properly configured', () => {
    // Test Expo module imports
    expect(() => require('expo-location')).not.toThrow();
    expect(() => require('expo-status-bar')).not.toThrow();
    
    // Test React Native specific modules
    expect(() => require('react-native-maps')).not.toThrow();
    expect(() => require('react-native-safe-area-context')).not.toThrow();
  });
});
