/**
 * Test utilities for subscription state manipulation and assertions
 */

import { act, renderHook } from '@testing-library/react-native';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { mockRevenueCatService, MockCustomerInfo, MockErrorCode } from './mockRevenueCat';

export interface SubscriptionTestScenario {
  name: string;
  customerInfo: MockCustomerInfo;
  expectedStatus: 'free' | 'premium' | 'loading';
  description: string;
}

/**
 * Predefined test scenarios for different subscription states
 */
export const subscriptionTestScenarios: SubscriptionTestScenario[] = [
  {
    name: 'free_user',
    customerInfo: mockRevenueCatService.createFreeCustomerInfo(),
    expectedStatus: 'free',
    description: 'User with no active subscriptions',
  },
  {
    name: 'premium_monthly_active',
    customerInfo: mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly'),
    expectedStatus: 'premium',
    description: 'User with active monthly premium subscription',
  },
  {
    name: 'premium_yearly_active',
    customerInfo: mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_yearly'),
    expectedStatus: 'premium',
    description: 'User with active yearly premium subscription',
  },
  {
    name: 'premium_cancelled_but_active',
    customerInfo: mockRevenueCatService.createCancelledCustomerInfo('oxalate_premium_monthly', 'test-user', 15),
    expectedStatus: 'premium',
    description: 'User with cancelled subscription that is still active until expiration',
  },
  {
    name: 'premium_expired',
    customerInfo: mockRevenueCatService.createExpiredCustomerInfo('oxalate_premium_monthly'),
    expectedStatus: 'free',
    description: 'User with expired premium subscription',
  },
  {
    name: 'premium_expired_recently',
    customerInfo: mockRevenueCatService.createExpiredCustomerInfo('oxalate_premium_yearly', 'test-user', 1),
    expectedStatus: 'free',
    description: 'User with recently expired premium subscription',
  },
  {
    name: 'premium_expired_long_ago',
    customerInfo: mockRevenueCatService.createExpiredCustomerInfo('oxalate_premium_monthly', 'test-user', 30),
    expectedStatus: 'free',
    description: 'User with long-expired premium subscription',
  },
];

/**
 * Usage limit test scenarios
 */
export interface UsageLimitTestScenario {
  name: string;
  subscriptionStatus: 'free' | 'premium';
  initialUsage: {
    oracleQuestions?: { monthlyCount?: number; todayCount?: number };
    recipes?: { currentCount?: number; todayCount?: number };
    tracking?: { startDate?: string; daysUsed?: number };
  };
  expectedLimits: {
    canAskOracleQuestion: boolean;
    canCreateRecipe: boolean;
    canTrack: boolean;
    remainingOracleQuestions: number;
    remainingRecipes: number;
    remainingTrackingDays: number;
  };
  description: string;
}

export const usageLimitTestScenarios: UsageLimitTestScenario[] = [
  {
    name: 'free_user_no_usage',
    subscriptionStatus: 'free',
    initialUsage: {},
    expectedLimits: {
      canAskOracleQuestion: true,
      canCreateRecipe: true,
      canTrack: true,
      remainingOracleQuestions: 10,
      remainingRecipes: 1,
      remainingTrackingDays: 3,
    },
    description: 'Free user with no usage',
  },
  {
    name: 'free_user_at_oracle_limit',
    subscriptionStatus: 'free',
    initialUsage: {
      oracleQuestions: { monthlyCount: 10 },
    },
    expectedLimits: {
      canAskOracleQuestion: false,
      canCreateRecipe: true,
      canTrack: true,
      remainingOracleQuestions: 0,
      remainingRecipes: 1,
      remainingTrackingDays: 3,
    },
    description: 'Free user at monthly Oracle question limit',
  },
  {
    name: 'free_user_at_recipe_limit',
    subscriptionStatus: 'free',
    initialUsage: {
      recipes: { currentCount: 1 },
    },
    expectedLimits: {
      canAskOracleQuestion: true,
      canCreateRecipe: false,
      canTrack: true,
      remainingOracleQuestions: 10,
      remainingRecipes: 0,
      remainingTrackingDays: 3,
    },
    description: 'Free user at recipe creation limit',
  },
  {
    name: 'free_user_at_tracking_limit',
    subscriptionStatus: 'free',
    initialUsage: {
      tracking: {
        startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
        daysUsed: 4,
      },
    },
    expectedLimits: {
      canAskOracleQuestion: true,
      canCreateRecipe: true,
      canTrack: false,
      remainingOracleQuestions: 10,
      remainingRecipes: 1,
      remainingTrackingDays: 0,
    },
    description: 'Free user at tracking day limit',
  },
  {
    name: 'premium_user_no_usage',
    subscriptionStatus: 'premium',
    initialUsage: {},
    expectedLimits: {
      canAskOracleQuestion: true,
      canCreateRecipe: true,
      canTrack: true,
      remainingOracleQuestions: 40,
      remainingRecipes: 10,
      remainingTrackingDays: 999,
    },
    description: 'Premium user with no usage',
  },
  {
    name: 'premium_user_at_daily_oracle_limit',
    subscriptionStatus: 'premium',
    initialUsage: {
      oracleQuestions: { todayCount: 40 },
    },
    expectedLimits: {
      canAskOracleQuestion: false,
      canCreateRecipe: true,
      canTrack: true,
      remainingOracleQuestions: 0,
      remainingRecipes: 10,
      remainingTrackingDays: 999,
    },
    description: 'Premium user at daily Oracle question limit',
  },
  {
    name: 'premium_user_at_daily_recipe_limit',
    subscriptionStatus: 'premium',
    initialUsage: {
      recipes: { todayCount: 10 },
    },
    expectedLimits: {
      canAskOracleQuestion: true,
      canCreateRecipe: false,
      canTrack: true,
      remainingOracleQuestions: 40,
      remainingRecipes: 0,
      remainingTrackingDays: 999,
    },
    description: 'Premium user at daily recipe creation limit',
  },
];

/**
 * Error test scenarios
 */
export interface ErrorTestScenario {
  name: string;
  errorCode: MockErrorCode;
  expectedBehavior: {
    shouldReturnFalse?: boolean;
    shouldMaintainState?: boolean;
    shouldLogError?: boolean;
  };
  description: string;
}

export const errorTestScenarios: ErrorTestScenario[] = [
  {
    name: 'user_cancelled_purchase',
    errorCode: 'PURCHASES_ERROR_USER_CANCELLED',
    expectedBehavior: {
      shouldReturnFalse: true,
      shouldMaintainState: true,
      shouldLogError: true,
    },
    description: 'User cancels purchase flow',
  },
  {
    name: 'payment_pending',
    errorCode: 'PURCHASES_ERROR_PAYMENT_PENDING',
    expectedBehavior: {
      shouldReturnFalse: true,
      shouldMaintainState: true,
      shouldLogError: true,
    },
    description: 'Payment is pending approval',
  },
  {
    name: 'store_problem',
    errorCode: 'PURCHASES_ERROR_STORE_PROBLEM',
    expectedBehavior: {
      shouldReturnFalse: true,
      shouldMaintainState: true,
      shouldLogError: true,
    },
    description: 'App store has a problem',
  },
  {
    name: 'network_error',
    errorCode: 'PURCHASES_ERROR_NETWORK_ERROR',
    expectedBehavior: {
      shouldReturnFalse: true,
      shouldMaintainState: true,
      shouldLogError: true,
    },
    description: 'Network connection failed',
  },
  {
    name: 'invalid_credentials',
    errorCode: 'PURCHASES_ERROR_INVALID_CREDENTIALS',
    expectedBehavior: {
      shouldReturnFalse: true,
      shouldMaintainState: true,
      shouldLogError: true,
    },
    description: 'Invalid API credentials',
  },
];

/**
 * Test utility functions
 */

/**
 * Sets up a subscription store with specific state
 */
export const setupSubscriptionStore = (
  status: 'free' | 'premium' | 'loading' = 'free',
  customerInfo: MockCustomerInfo | null = null,
  usageOverrides: any = {}
) => {
  const { result } = renderHook(() => useSubscriptionStore());
  
  act(() => {
    const currentUsageLimits = result.current.usageLimits;
    const newUsageLimits = {
      oracleQuestions: {
        ...currentUsageLimits.oracleQuestions,
        ...usageOverrides.oracleQuestions,
      },
      recipes: {
        ...currentUsageLimits.recipes,
        ...usageOverrides.recipes,
      },
      tracking: {
        ...currentUsageLimits.tracking,
        ...usageOverrides.tracking,
      },
    };
    
    useSubscriptionStore.setState({
      status,
      customerInfo,
      usageLimits: newUsageLimits,
    });
  });
  
  return result;
};

/**
 * Simulates date changes for testing time-based logic
 */
export const simulateDateChange = (daysOffset: number) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysOffset);
  
  // Mock Date constructor
  const originalDate = Date;
  global.Date = jest.fn(() => targetDate) as any;
  global.Date.now = () => targetDate.getTime();
  global.Date.prototype = originalDate.prototype;
  
  return () => {
    // Restore original Date
    global.Date = originalDate;
  };
};

/**
 * Simulates month changes for testing monthly reset logic
 */
export const simulateMonthChange = (monthsOffset: number) => {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsOffset);
  
  // Mock Date constructor
  const originalDate = Date;
  global.Date = jest.fn(() => targetDate) as any;
  global.Date.now = () => targetDate.getTime();
  global.Date.prototype = originalDate.prototype;
  
  return () => {
    // Restore original Date
    global.Date = originalDate;
  };
};

/**
 * Asserts subscription state matches expected values
 */
export const assertSubscriptionState = (
  result: any,
  expected: {
    status?: 'free' | 'premium' | 'loading';
    canAskOracleQuestion?: boolean;
    canCreateRecipe?: boolean;
    canTrack?: boolean;
    remainingOracleQuestions?: number;
    remainingRecipes?: number;
    remainingTrackingDays?: number;
  }
) => {
  if (expected.status !== undefined) {
    expect(result.current.status).toBe(expected.status);
  }
  
  if (expected.canAskOracleQuestion !== undefined) {
    expect(result.current.canAskOracleQuestion()).toBe(expected.canAskOracleQuestion);
  }
  
  if (expected.canCreateRecipe !== undefined) {
    expect(result.current.canCreateRecipe()).toBe(expected.canCreateRecipe);
  }
  
  if (expected.canTrack !== undefined) {
    expect(result.current.canTrack()).toBe(expected.canTrack);
  }
  
  if (expected.remainingOracleQuestions !== undefined) {
    expect(result.current.getRemainingOracleQuestions()).toBe(expected.remainingOracleQuestions);
  }
  
  if (expected.remainingRecipes !== undefined) {
    expect(result.current.getRemainingRecipes()).toBe(expected.remainingRecipes);
  }
  
  if (expected.remainingTrackingDays !== undefined) {
    expect(result.current.getRemainingTrackingDays()).toBe(expected.remainingTrackingDays);
  }
};

/**
 * Runs a usage limit test scenario
 */
export const runUsageLimitScenario = async (scenario: UsageLimitTestScenario) => {
  // Set up mock RevenueCat service
  if (scenario.subscriptionStatus === 'premium') {
    mockRevenueCatService.setCustomerInfo(
      mockRevenueCatService.createPremiumCustomerInfo()
    );
  } else {
    mockRevenueCatService.setCustomerInfo(
      mockRevenueCatService.createFreeCustomerInfo()
    );
  }
  
  // Set up subscription store
  const result = setupSubscriptionStore(
    scenario.subscriptionStatus,
    scenario.subscriptionStatus === 'premium' 
      ? mockRevenueCatService.createPremiumCustomerInfo()
      : mockRevenueCatService.createFreeCustomerInfo(),
    scenario.initialUsage
  );
  
  // Assert expected limits
  assertSubscriptionState(result, scenario.expectedLimits);
  
  return result;
};

/**
 * Runs an error test scenario
 */
export const runErrorScenario = async (
  scenario: ErrorTestScenario,
  operation: 'purchase' | 'restore' | 'initialize'
) => {
  // Set up error in mock service
  mockRevenueCatService.forceNextError(scenario.errorCode);
  
  const result = setupSubscriptionStore();
  const initialState = {
    status: result.current.status,
    customerInfo: result.current.customerInfo,
  };
  
  let operationResult: any;
  let threwError = false;
  
  try {
    switch (operation) {
      case 'purchase':
        operationResult = await result.current.purchaseProduct('oxalate_premium_monthly');
        break;
      case 'restore':
        operationResult = await result.current.restorePurchases();
        break;
      case 'initialize':
        operationResult = await result.current.initializePurchases();
        break;
    }
  } catch (error) {
    threwError = true;
  }
  
  // Assert expected behavior
  if (scenario.expectedBehavior.shouldReturnFalse) {
    expect(operationResult).toBe(false);
  }
  
  if (scenario.expectedBehavior.shouldMaintainState) {
    expect(result.current.status).toBe(initialState.status);
    expect(result.current.customerInfo).toBe(initialState.customerInfo);
  }
  
  return { result, operationResult, threwError };
};

/**
 * Creates a comprehensive test suite for a subscription feature
 */
export const createSubscriptionTestSuite = (
  featureName: string,
  testFunction: (result: any) => void
) => {
  describe(`${featureName} - Subscription Integration`, () => {
    beforeEach(() => {
      mockRevenueCatService.reset();
    });
    
    subscriptionTestScenarios.forEach(scenario => {
      it(`should work correctly for ${scenario.name}`, async () => {
        mockRevenueCatService.setCustomerInfo(scenario.customerInfo);
        const result = setupSubscriptionStore(scenario.expectedStatus, scenario.customerInfo);
        
        await act(async () => {
          testFunction(result);
        });
      });
    });
  });
};

/**
 * Resets all test state
 */
export const resetTestState = () => {
  mockRevenueCatService.reset();
  useSubscriptionStore.persist.clearStorage();
  jest.clearAllMocks();
};