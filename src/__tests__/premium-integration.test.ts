import { act, renderHook } from '@testing-library/react-native';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { useMealStore } from '../state/mealStore';
import { useRecipeStore } from '../state/recipeStore';
import { useOracleStore } from '../state/oracleStore';
import { createMockCustomerInfo, createMockAsyncStorage } from '../test-utils';
import Purchases from 'react-native-purchases';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => createMockAsyncStorage());

// Mock RevenueCat
const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

describe('Premium Feature Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all stores
    act(() => {
      useSubscriptionStore.setState({
        status: 'free',
        customerInfo: null,
        offerings: null,
        usageLimits: {
          oracleQuestions: {
            dailyLimit: 5,
            todayCount: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          },
          recipes: {
            freeLimit: 1,
            currentCount: 0,
          },
          tracking: {
            freeDays: 7,
            startDate: null,
            daysUsed: 0,
          },
        },
      });
    });
  });

  describe('Free to Premium Upgrade Flow', () => {
    it('should upgrade user from free to premium and unlock all features', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Start as free user
      expect(subscriptionResult.current.status).toBe('free');
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(true);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(true);
      expect(subscriptionResult.current.canTrack()).toBe(true);

      // Simulate reaching free limits
      act(() => {
        // Use all oracle questions
        for (let i = 0; i < 5; i++) {
          subscriptionResult.current.incrementOracleQuestions();
        }
        // Use recipe limit
        subscriptionResult.current.incrementRecipeCount();
        // Use tracking days (simulate 8 days later)
        useSubscriptionStore.setState({
          ...useSubscriptionStore.getState(),
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            tracking: {
              freeDays: 7,
              startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              daysUsed: 8,
            },
          },
        });
      });

      // Verify limits are reached
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(false);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(false);
      expect(subscriptionResult.current.canTrack()).toBe(false);

      // Mock successful purchase
      const premiumCustomerInfo = createMockCustomerInfo({
        entitlements: {
          active: {
            premium: {
              isActive: true,
              willRenew: true,
              periodType: 'normal',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              store: 'app_store',
              productIdentifier: 'oxalate_premium_monthly',
              isSandbox: true,
              ownershipType: 'PURCHASED',
            },
          },
        },
      });

      mockPurchases.purchaseProduct.mockResolvedValue({
        customerInfo: premiumCustomerInfo,
        productIdentifier: 'oxalate_premium_monthly',
        transactionIdentifier: 'test-transaction',
      });

      // Purchase premium
      let purchaseSuccess = false;
      await act(async () => {
        purchaseSuccess = await subscriptionResult.current.purchaseProduct('oxalate_premium_monthly');
      });

      expect(purchaseSuccess).toBe(true);
      expect(subscriptionResult.current.status).toBe('premium');

      // Verify all features are now unlimited
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(true);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(true);
      expect(subscriptionResult.current.canTrack()).toBe(true);
      expect(subscriptionResult.current.getRemainingOracleQuestions()).toBe(999);
      expect(subscriptionResult.current.getRemainingRecipes()).toBe(999);
      expect(subscriptionResult.current.getRemainingTrackingDays()).toBe(999);
    });
  });

  describe('Oracle Premium Features', () => {
    it('should allow unlimited oracle questions for premium users', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Upgrade to premium
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      // Use way more than the free limit
      for (let i = 0; i < 50; i++) {
        act(() => {
          const success = subscriptionResult.current.incrementOracleQuestions();
          expect(success).toBe(true);
        });
      }

      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(true);
      expect(subscriptionResult.current.getRemainingOracleQuestions()).toBe(999);
    });

    it('should respect daily limits for free users but reset next day', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Use all daily oracle questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          subscriptionResult.current.incrementOracleQuestions();
        });
      }

      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(false);
      expect(subscriptionResult.current.getRemainingOracleQuestions()).toBe(0);

      // Simulate next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      act(() => {
        useSubscriptionStore.setState({
          ...useSubscriptionStore.getState(),
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            oracleQuestions: {
              ...useSubscriptionStore.getState().usageLimits.oracleQuestions,
              lastResetDate: tomorrow.toISOString().split('T')[0],
            },
          },
        });
      });

      // Should be able to ask questions again
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(true);
      expect(subscriptionResult.current.getRemainingOracleQuestions()).toBe(5);
    });
  });

  describe('Recipe Premium Features', () => {
    it('should allow unlimited recipes for premium users', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Upgrade to premium
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      // Create many recipes (way more than free limit)
      for (let i = 0; i < 10; i++) {
        act(() => {
          const success = subscriptionResult.current.incrementRecipeCount();
          expect(success).toBe(true);
        });
      }

      expect(subscriptionResult.current.canCreateRecipe()).toBe(true);
      expect(subscriptionResult.current.getRemainingRecipes()).toBe(999);
    });

    it('should block recipe creation after limit for free users', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Use the one free recipe
      act(() => {
        const success = subscriptionResult.current.incrementRecipeCount();
        expect(success).toBe(true);
      });

      expect(subscriptionResult.current.canCreateRecipe()).toBe(false);
      expect(subscriptionResult.current.getRemainingRecipes()).toBe(0);

      // Should fail to create another
      act(() => {
        const success = subscriptionResult.current.incrementRecipeCount();
        expect(success).toBe(false);
      });
    });
  });

  describe('Tracking Premium Features', () => {
    it('should allow unlimited tracking for premium users', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Upgrade to premium
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      // Simulate tracking for many days
      for (let i = 0; i < 30; i++) {
        act(() => {
          const success = subscriptionResult.current.incrementTrackingDay();
          expect(success).toBe(true);
        });
      }

      expect(subscriptionResult.current.canTrack()).toBe(true);
      expect(subscriptionResult.current.getRemainingTrackingDays()).toBe(999);
    });

    it('should block tracking after 7 days for free users', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Start tracking
      act(() => {
        subscriptionResult.current.startTracking();
      });

      expect(subscriptionResult.current.canTrack()).toBe(true);

      // Simulate 8 days later
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      act(() => {
        useSubscriptionStore.setState({
          ...useSubscriptionStore.getState(),
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            tracking: {
              freeDays: 7,
              startDate: eightDaysAgo.toISOString().split('T')[0],
              daysUsed: 8,
            },
          },
        });
      });

      expect(subscriptionResult.current.canTrack()).toBe(false);
      expect(subscriptionResult.current.getRemainingTrackingDays()).toBe(0);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should maintain feature limits independently for free users', () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Exhaust oracle questions
      for (let i = 0; i < 5; i++) {
        act(() => {
          subscriptionResult.current.incrementOracleQuestions();
        });
      }

      // Should still be able to use recipes and tracking
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(false);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(true);
      expect(subscriptionResult.current.canTrack()).toBe(true);

      // Exhaust recipe limit
      act(() => {
        subscriptionResult.current.incrementRecipeCount();
      });

      // Should still be able to track
      expect(subscriptionResult.current.canCreateRecipe()).toBe(false);
      expect(subscriptionResult.current.canTrack()).toBe(true);
    });

    it('should unlock all features simultaneously when upgrading to premium', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      // Exhaust all free limits
      act(() => {
        // Oracle
        for (let i = 0; i < 5; i++) {
          subscriptionResult.current.incrementOracleQuestions();
        }
        // Recipe
        subscriptionResult.current.incrementRecipeCount();
        // Tracking (simulate trial ended)
        useSubscriptionStore.setState({
          ...useSubscriptionStore.getState(),
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            tracking: {
              freeDays: 7,
              startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              daysUsed: 8,
            },
          },
        });
      });

      // Verify all limits reached
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(false);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(false);
      expect(subscriptionResult.current.canTrack()).toBe(false);

      // Upgrade to premium
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      // All features should be unlocked
      expect(subscriptionResult.current.canAskOracleQuestion()).toBe(true);
      expect(subscriptionResult.current.canCreateRecipe()).toBe(true);
      expect(subscriptionResult.current.canTrack()).toBe(true);
    });
  });

  describe('Purchase Flow Error Handling', () => {
    it('should handle purchase cancellation gracefully', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      mockPurchases.purchaseProduct.mockRejectedValue(new Error('User cancelled'));

      let purchaseSuccess = true;
      await act(async () => {
        purchaseSuccess = await subscriptionResult.current.purchaseProduct('oxalate_premium_monthly');
      });

      expect(purchaseSuccess).toBe(false);
      expect(subscriptionResult.current.status).toBe('free'); // Should remain free
    });

    it('should handle restore purchases when premium subscription exists', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      const premiumCustomerInfo = createMockCustomerInfo({
        entitlements: {
          active: {
            premium: {
              isActive: true,
              willRenew: true,
              periodType: 'normal',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              store: 'app_store',
              productIdentifier: 'oxalate_premium_monthly',
              isSandbox: true,
              ownershipType: 'PURCHASED',
            },
          },
        },
      });

      mockPurchases.restorePurchases.mockResolvedValue(premiumCustomerInfo);

      let restored = false;
      await act(async () => {
        restored = await subscriptionResult.current.restorePurchases();
      });

      expect(restored).toBe(true);
      expect(subscriptionResult.current.status).toBe('premium');
    });

    it('should handle restore purchases when no subscription exists', async () => {
      const { result: subscriptionResult } = renderHook(() => useSubscriptionStore());

      const freeCustomerInfo = createMockCustomerInfo();
      mockPurchases.restorePurchases.mockResolvedValue(freeCustomerInfo);

      let restored = true;
      await act(async () => {
        restored = await subscriptionResult.current.restorePurchases();
      });

      expect(restored).toBe(false);
      expect(subscriptionResult.current.status).toBe('free');
    });
  });
});