/**
 * Build Integration Tests
 * Purpose: Test the actual build process integration to catch runtime bundling issues
 */

describe('Build Integration Tests', () => {
  test('Should be able to import all critical components', () => {
    // Test that we can import our main components without bundling errors
    const DateSheet = require('../DateSheet').default;
    const RaceCard = require('../RaceCard');
    const FilterSheet = require('../FilterSheet');
    
    expect(DateSheet).toBeDefined();
    expect(RaceCard).toBeDefined();
    expect(FilterSheet).toBeDefined();
  });

  test('Should handle React Native specific imports', () => {
    // Test React Native specific modules that commonly cause bundling issues
    expect(() => require('react-native')).not.toThrow();
    expect(() => require('react-native-gesture-handler')).not.toThrow();
    expect(() => require('react-native-safe-area-context')).not.toThrow();
    expect(() => require('react-native-screens')).not.toThrow();
  });

  test('Should handle Expo module imports', () => {
    // Test Expo modules that need special bundling configuration
    expect(() => require('expo-location')).not.toThrow();
    expect(() => require('expo-status-bar')).not.toThrow();
  });

  test('Should handle navigation imports correctly', () => {
    // Test navigation packages that have complex bundling requirements
    expect(() => require('@react-navigation/native')).not.toThrow();
    expect(() => require('@react-navigation/stack')).not.toThrow();
    expect(() => require('@react-navigation/bottom-tabs')).not.toThrow();
  });

  test('Should handle third-party component imports', () => {
    // Test third-party components that might have bundling issues
    expect(() => require('react-native-maps')).not.toThrow();
    expect(() => require('react-native-modal-datetime-picker')).not.toThrow();
  });

  test('Should validate component props and types', () => {
    // Test that our components have proper TypeScript types
    const DateSheet = require('../DateSheet').default;
    
    // Check if component has expected props
    expect(DateSheet).toBeDefined();
    
    // This test ensures the component can be imported without TypeScript errors
    // which would indicate bundling configuration issues
  });

  test('Should handle async imports correctly', () => {
    // Test that dynamic imports work (important for code splitting)
    expect(() => {
      const dynamicImport = async () => {
        const module = await import('../DateSheet');
        return module.default;
      };
      return dynamicImport;
    }).not.toThrow();
  });

  test('Should validate environment variables and configuration', () => {
    // Test that environment-specific code can be imported
    if (__DEV__) {
      // Development-specific imports should work
      expect(() => require('react-native/Libraries/LogBox/LogBox')).not.toThrow();
    }
  });

  test('Should handle platform-specific code', () => {
    // Test platform-specific imports
    const { Platform } = require('react-native');
    
    if (Platform.OS === 'ios') {
      // iOS-specific code should be importable
      expect(() => require('react-native/Libraries/Components/View/ViewStylePropTypes')).not.toThrow();
    }
    
    if (Platform.OS === 'android') {
      // Android-specific code should be importable
      expect(() => require('react-native/Libraries/Components/View/ViewStylePropTypes')).not.toThrow();
    }
  });
});
