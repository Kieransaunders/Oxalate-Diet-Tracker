module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest-polyfills.js'],
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@expo|expo|react-native|@react-native|@react-navigation|react-navigation|@react-native-async-storage|@react-native-clipboard|@shopify/flash-list|@anthropic-ai|openai|zustand|react-native-purchases|react-native-mmkv|react-native-reanimated|lottie-react-native|nativewind)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.stories.*',
    '!src/config/**/*',
    '!src/test-utils/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    __DEV__: true,
  },
  testPathIgnorePatterns: [
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
    '<rootDir>/node_modules/'
  ]
};