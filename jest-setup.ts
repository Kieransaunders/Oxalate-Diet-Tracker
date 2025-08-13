import '@testing-library/react-native/extend-expect';

// Mock react-native-reanimated
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: () => () => null,
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
  appOwnership: 'standalone',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-application', () => ({
  getInstallationTimeAsync: jest.fn().mockResolvedValue(Date.now()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn().mockReturnValue([]),
    clearAll: jest.fn(),
  })),
}));

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  setDebugLogsEnabled: jest.fn(),
  PurchasesPackage: {},
  CustomerInfo: {},
  EntitlementInfo: {},
}));

jest.mock('react-native-purchases-ui', () => ({
  presentPaywall: jest.fn(),
}));

// Mock AI SDKs
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    images: {
      generate: jest.fn(),
    },
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
  })),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({
    top: 20,
    bottom: 20,
    left: 0,
    right: 0,
  }),
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock environment variables
process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY = 'test-openai-key';
process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY = 'test-grok-key';
process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'test-ios-key';
process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = 'test-android-key';

// Global test utilities
global.fetch = jest.fn();

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};