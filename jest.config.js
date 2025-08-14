const { defaults } = require('jest-config');

module.exports = {
  testEnvironment: '<rootDir>/jest-environment-jsdom-fix.js',
  setupFiles: [
    '<rootDir>/jest-polyfills.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|expo-network|expo-modules-core|@react-navigation|@react-native-async-storage|@react-native-clipboard|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@shopify/flash-list|zustand|react-native-purchases|react-native-mmkv|nativewind)/)'
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