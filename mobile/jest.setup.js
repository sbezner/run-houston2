// Jest setup file for React Native testing with jest-expo

// Mock Platform at multiple levels to ensure it's available everywhere
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
}));

jest.mock('expo-modules-core', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  requireNativeModule: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => ({})),
}));

// Mock @expo/vector-icons completely
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  AntDesign: 'AntDesign',
  Entypo: 'Entypo',
  EvilIcons: 'EvilIcons',
  Feather: 'Feather',
  FontAwesome: 'FontAwesome',
  Foundation: 'Foundation',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Octicons: 'Octicons',
  SimpleLineIcons: 'SimpleLineIcons',
  Zocial: 'Zocial',
}));

// Mock Platform for react-native-maps and other packages
jest.mock('react-native-maps/lib/decorateMapComponent', () => ({
  getNativeMapName: () => 'AIRMap',
}));

// Mock React Native Modal component to fix Platform.OS access
jest.mock('react-native', () => {
  const React = require('react');
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Modal: function Modal({ children, visible, ...props }) {
      if (!visible) return null;
      return React.createElement(RN.View, { testID: 'modal' }, children);
    },
  };
});

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  
  return function DateTimePicker({ onChange, value, mode, ...props }) {
    return React.createElement(View, { testID: 'datetime-picker' }, [
      React.createElement(TouchableOpacity, { 
        key: 'picker-button',
        onPress: () => onChange && onChange({}, value || new Date()) 
      }, React.createElement(Text, {}, 'DateTimePicker'))
    ]);
  };
});

// Mock third-party components that need Platform
jest.mock('react-native-maps', () => ({
  MapView: 'MapView',
  Marker: 'Marker',
  Callout: 'Callout',
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  State: { BEGAN: 0, ACTIVE: 1, END: 2 },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
}));

jest.mock('react-native-modal-datetime-picker', () => ({
  DateTimePickerModal: 'DateTimePickerModal',
}));

// Mock navigation packages
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: 'NavigationContainer',
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: 'StackNavigator',
    Screen: 'StackScreen',
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: 'TabNavigator',
    Screen: 'TabScreen',
  }),
}));

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Global polyfills
const { TextDecoder, TextEncoder } = require('util');
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Global Platform mock
global.Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
};

// Note: react-native mock removed to avoid circular dependencies
// Platform is mocked at the module level above

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
