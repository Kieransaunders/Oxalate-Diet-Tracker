import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(SafeAreaProvider, null, children);
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const createMockFood = (overrides = {}) => ({
  id: '1',
  name: 'Test Food',
  oxalate_mg: 10,
  serving_size: '1 cup',
  category: 'Low' as const,
  group: 'vegetables',
  calcium_mg: 50,
  calories: 25,
  protein_g: 2,
  fiber_g: 3,
  ...overrides,
});

export const createMockMealItem = (overrides = {}) => ({
  id: '1',
  food: createMockFood(),
  portion: 1,
  oxalateAmount: 10,
  timestamp: Date.now(),
  ...overrides,
});

export const createMockCustomerInfo = (overrides: any = {}) => ({
  entitlements: {
    active: {
      premium: {
        isActive: false,
        willRenew: false,
        periodType: 'normal',
        latestPurchaseDate: new Date().toISOString(),
        originalPurchaseDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        store: 'app_store',
        productIdentifier: 'oxalate_premium_monthly',
        isSandbox: true,
        ownershipType: 'PURCHASED',
        ...overrides.entitlements?.active?.premium,
      },
    },
  },
  allPurchaseDates: {},
  activeSubscriptions: [],
  nonSubscriptionTransactions: [],
  requestDate: new Date().toISOString(),
  latestExpirationDate: null,
  originalPurchaseDate: null,
  originalApplicationVersion: '1.0.0',
  managementURL: null,
  firstSeen: new Date().toISOString(),
  originalAppUserId: 'test-user',
  ...overrides,
});

export const createMockRecipe = (overrides = {}) => ({
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: ['Test ingredient 1', 'Test ingredient 2'],
  instructions: ['Step 1', 'Step 2'],
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  totalOxalate: 15,
  category: 'Main Course',
  isAIGenerated: false,
  createdAt: Date.now(),
  ...overrides,
});

// Test utilities
export const createMockAsyncStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
    multiGet: jest.fn((keys: string[]) => 
      Promise.resolve(keys.map(key => [key, storage[key] || null]))
    ),
    multiSet: jest.fn((keyValuePairs: [string, string][]) => {
      keyValuePairs.forEach(([key, value]) => {
        storage[key] = value;
      });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(key => delete storage[key]);
      return Promise.resolve();
    }),
  };
};

export const createMockMMKV = () => ({
  set: jest.fn(),
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  delete: jest.fn(),
  getAllKeys: jest.fn(() => []),
  clearAll: jest.fn(),
});

// Wait utilities
export const waitForStoreUpdate = () => new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };