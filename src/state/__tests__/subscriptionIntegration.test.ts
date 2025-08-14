/**
 * Integration tests for premium features and subscription flows
 * Tests complete user journeys from free to premium and cross-feature interactions
 */

import { act, renderHook } from '@testing-library/react-native';
import { useSubscriptionStore } from '../subscriptionStore';
import { 
  mockRevenueCatService, 
  MockCustomerInfo,
} from '../../test-utils/mockRevenueCat';
import {
  setupSubscriptionStore,
  assertSubscriptionState,
  simulateDateChange,
  simulateMonthChange,
  resetTestState,
  usageLimitTestScenarios,
  runUsageLimitScenario,
  subscriptionTestScenarios,
} from '../../test-utils/subscriptionTestUtils';
import * as revenueCatConfig from '../../config/revenuecat';

// Mock the RevenueCat config functions
jest.mock('../../config/revenuecat', () => ({
  shouldBypassPremium: jest.fn(() => false),
  isTestingMode: jest.fn(() => false),
  createMockCustomerInfo: jest.fn(),
}));

describe('Premium Feature Integration Tests', () => {
  beforeEach(() => {
    resetTestState();
    
    // Reset RevenueCat config mocks
    (revenueCatConfig.shouldBypassPremium as jest.Mock).mockReturnValue(false);
    (revenueCatConfig.isTestingMode as jest.Mock).mockReturnValue(false);
  });

  describe('Free User to Premium Upgrade Flow', () => {
    it('should complete full upgrade flow from hitting Oracle limit to premium unlock', async () => {
      // Start as free user
      const result = setupSubscriptionStore('free');
      
      // Use up Oracle questions to monthly limit
      for (let i = 0; i < 10; i++) {
        expect(result.current.incrementOracleQuestions()).toBe(true);
      }
      
      // Should be blocked at limit
      expect(result.current.incrementOracleQuestions()).toBe(false);
      expect(result.current.canAskOracleQuestion()).toBe(false);
      expect(result.current.getRemainingOracleQuestions()).toBe(0);
      
      // Simulate successful premium purchase
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly')
      );
      
      let purchaseResult: boolean;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('oxalate_premium_monthly');
      });
      
      // Purchase should succeed and unlock premium features
      expect(purchaseResult!).toBe(true);
      expect(result.current.status).toBe('premium');
      
      // Should now have premium limits
      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.getRemainingOracleQuestions()).toBe(40); // Daily limit for premium
      
      // Should be able to ask more Oracle questions
      expect(result.current.incrementOracleQuestions()).toBe(true);
      expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(1);
    });

    it('should complete full upgrade flow from hitting recipe limit to premium unlock', async () => {
      // Start as free user
      const result = setupSubscriptionStore('free');
      
      // Use up recipe limit
      expect(result.current.incrementRecipeCount()).toBe(true);
      expect(result.current.incrementRecipeCount()).toBe(false);
      expect(result.current.canCreateRecipe()).toBe(false);
      expect(result.current.getRemainingRecipes()).toBe(0);
      
      // Simulate successful premium purchase
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_yearly')
      );
      
      let purchaseResult: boolean;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('oxalate_premium_yearly');
      });
      
      // Purchase should succeed and unlock premium features
      expect(purchaseResult!).toBe(true);
      expect(result.current.status).toBe('premium');
      
      // Should now have premium limits
      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.getRemainingRecipes()).toBe(10); // Daily limit for premium
      
      // Should be able to create more recipes
      expect(result.current.incrementRecipeCount()).toBe(true);
      expect(result.current.usageLimits.recipes.todayCount).toBe(1);
    });

    it('should complete full upgrade flow from hitting tracking limit to premium unlock', async () => {
      // Start as free user with tracking at limit
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = setupSubscriptionStore('free', null, {
        tracking: {
          startDate: fourDaysAgo,
          daysUsed: 4,
        },
      });
      
      // Should be blocked at tracking limit
      expect(result.current.canTrack()).toBe(false);
      expect(result.current.startTracking()).toBe(false);
      expect(result.current.getRemainingTrackingDays()).toBe(0);
      
      // Simulate successful premium purchase
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly')
      );
      
      let purchaseResult: boolean;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('oxalate_premium_monthly');
      });
      
      // Purchase should succeed and unlock premium features
      expect(purchaseResult!).toBe(true);
      expect(result.current.status).toBe('premium');
      
      // Should now have unlimited tracking
      expect(result.current.canTrack()).toBe(true);
      expect(result.current.startTracking()).toBe(true);
      expect(result.current.getRemainingTrackingDays()).toBe(999);
    });
  });

  describe('Cross-Feature Independence for Free Users', () => {
    it('should maintain independent limits across Oracle, recipes, and tracking', async () => {
      const result = setupSubscriptionStore('free');
      
      // Use Oracle questions - should not affect other features
      for (let i = 0; i < 5; i++) {
        result.current.incrementOracleQuestions();
      }
      
      expect(result.current.getRemainingOracleQuestions()).toBe(5);
      expect(result.current.getRemainingRecipes()).toBe(1); // Unaffected
      expect(result.current.getRemainingTrackingDays()).toBe(3); // Unaffected
      
      // Use recipe limit - should not affect other features
      result.current.incrementRecipeCount();
      
      expect(result.current.getRemainingOracleQuestions()).toBe(5); // Unaffected
      expect(result.current.getRemainingRecipes()).toBe(0);
      expect(result.current.getRemainingTrackingDays()).toBe(3); // Unaffected
      
      // Start tracking - should not affect other features
      result.current.startTracking();
      
      expect(result.current.getRemainingOracleQuestions()).toBe(5); // Unaffected
      expect(result.current.getRemainingRecipes()).toBe(0); // Unaffected
      expect(result.current.getRemainingTrackingDays()).toBe(3);
    });

    it('should allow one feature to be at limit while others remain available', async () => {
      const result = setupSubscriptionStore('free');
      
      // Hit Oracle limit
      for (let i = 0; i < 10; i++) {
        result.current.incrementOracleQuestions();
      }
      
      expect(result.current.canAskOracleQuestion()).toBe(false);
      expect(result.current.canCreateRecipe()).toBe(true); // Still available
      expect(result.current.canTrack()).toBe(true); // Still available
      
      // Hit recipe limit
      result.current.incrementRecipeCount();
      
      expect(result.current.canAskOracleQuestion()).toBe(false); // Still blocked
      expect(result.current.canCreateRecipe()).toBe(false);
      expect(result.current.canTrack()).toBe(true); // Still available
      
      // Hit tracking limit
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      act(() => {
        const newUsageLimits = {
          ...result.current.usageLimits,
          tracking: {
            ...result.current.usageLimits.tracking,
            startDate: fourDaysAgo,
            daysUsed: 4,
          },
        };
        useSubscriptionStore.setState({ usageLimits: newUsageLimits });
      });
      
      expect(result.current.canAskOracleQuestion()).toBe(false); // Still blocked
      expect(result.current.canCreateRecipe()).toBe(false); // Still blocked
      expect(result.current.canTrack()).toBe(false);
    });

    it('should reset limits independently for different features', async () => {
      const result = setupSubscriptionStore('free');
      
      // Use up all limits
      for (let i = 0; i < 10; i++) {
        result.current.incrementOracleQuestions();
      }
      result.current.incrementRecipeCount();
      result.current.startTracking();
      
      // Simulate new month (should reset Oracle questions only)
      const restoreDate = simulateMonthChange(1);
      
      act(() => {
        result.current.resetMonthlyLimits();
      });
      
      expect(result.current.canAskOracleQuestion()).toBe(true); // Reset
      expect(result.current.canCreateRecipe()).toBe(false); // Not reset
      expect(result.current.canTrack()).toBe(true); // Still within 3 days
      
      restoreDate();
    });
  });

  describe('Subscription Restoration Flow', () => {
    it('should restore premium subscription and unlock all features', async () => {
      // Start as free user with all limits used
      const result = setupSubscriptionStore('free', null, {
        oracleQuestions: { monthlyCount: 10 },
        recipes: { currentCount: 1 },
        tracking: {
          startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysUsed: 4,
        },
      });
      
      // All features should be blocked
      expect(result.current.canAskOracleQuestion()).toBe(false);
      expect(result.current.canCreateRecipe()).toBe(false);
      expect(result.current.canTrack()).toBe(false);
      
      // Set up premium customer info in mock service
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_yearly')
      );
      
      // Restore purchases
      let restoreResult: boolean;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });
      
      // Should restore premium status
      expect(restoreResult!).toBe(true);
      expect(result.current.status).toBe('premium');
      
      // All features should be unlocked
      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.canTrack()).toBe(true);
      
      // Should have premium limits
      expect(result.current.getRemainingOracleQuestions()).toBe(40);
      expect(result.current.getRemainingRecipes()).toBe(10);
      expect(result.current.getRemainingTrackingDays()).toBe(999);
    });

    it('should handle restore with no active subscriptions', async () => {
      const result = setupSubscriptionStore('free');
      
      // Set up free customer info in mock service
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createFreeCustomerInfo()
      );
      
      // Restore purchases
      let restoreResult: boolean;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });
      
      // Should not restore premium status
      expect(restoreResult!).toBe(false);
      expect(result.current.status).toBe('free');
      
      // Should maintain free limits
      expect(result.current.getRemainingOracleQuestions()).toBe(10);
      expect(result.current.getRemainingRecipes()).toBe(1);
      expect(result.current.getRemainingTrackingDays()).toBe(3);
    });

    it('should handle restore with expired subscription', async () => {
      const result = setupSubscriptionStore('free');
      
      // Set up expired customer info in mock service
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createExpiredCustomerInfo('oxalate_premium_monthly')
      );
      
      // Restore purchases
      let restoreResult: boolean;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });
      
      // Should not restore premium status for expired subscription
      expect(restoreResult!).toBe(false);
      expect(result.current.status).toBe('free');
    });

    it('should handle restore with cancelled but still active subscription', async () => {
      const result = setupSubscriptionStore('free');
      
      // Set up cancelled but active customer info in mock service
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createCancelledCustomerInfo('oxalate_premium_monthly', 'test-user', 15)
      );
      
      // Restore purchases
      let restoreResult: boolean;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });
      
      // Should restore premium status even if cancelled (still active until expiration)
      expect(restoreResult!).toBe(true);
      expect(result.current.status).toBe('premium');
    });
  });

  describe('Premium Feature Unlocking After Purchase', () => {
    it('should immediately unlock Oracle questions after premium purchase', async () => {
      const result = setupSubscriptionStore('free', null, {
        oracleQuestions: { monthlyCount: 10 },
      });
      
      // Should be blocked initially
      expect(result.current.canAskOracleQuestion()).toBe(false);
      
      // Purchase premium
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly')
      );
      
      await act(async () => {
        await result.current.purchaseProduct('oxalate_premium_monthly');
      });
      
      // Should immediately unlock
      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.incrementOracleQuestions()).toBe(true);
    });

    it('should immediately unlock recipe creation after premium purchase', async () => {
      const result = setupSubscriptionStore('free', null, {
        recipes: { currentCount: 1 },
      });
      
      // Should be blocked initially
      expect(result.current.canCreateRecipe()).toBe(false);
      
      // Purchase premium
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_yearly')
      );
      
      await act(async () => {
        await result.current.purchaseProduct('oxalate_premium_yearly');
      });
      
      // Should immediately unlock
      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.incrementRecipeCount()).toBe(true);
    });

    it('should immediately unlock tracking after premium purchase', async () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = setupSubscriptionStore('free', null, {
        tracking: {
          startDate: fourDaysAgo,
          daysUsed: 4,
        },
      });
      
      // Should be blocked initially
      expect(result.current.canTrack()).toBe(false);
      
      // Purchase premium
      mockRevenueCatService.setCustomerInfo(
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly')
      );
      
      await act(async () => {
        await result.current.purchaseProduct('oxalate_premium_monthly');
      });
      
      // Should immediately unlock
      expect(result.current.canTrack()).toBe(true);
      expect(result.current.startTracking()).toBe(true);
    });

    it('should maintain premium access across app restarts', async () => {
      // Simulate app restart by creating new store instance
      const result1 = setupSubscriptionStore('premium', 
        mockRevenueCatService.createPremiumCustomerInfo('oxalate_premium_monthly')
      );
      
      // Use some premium features
      result1.current.incrementOracleQuestions();
      result1.current.incrementRecipeCount();
      
      expect(result1.current.status).toBe('premium');
      expect(result1.current.usageLimits.oracleQuestions.todayCount).toBe(1);
      expect(result1.current.usageLimits.recipes.todayCount).toBe(1);
      
      // Simulate app restart - create new hook instance
      const result2 = renderHook(() => useSubscriptionStore());
      
      // Should maintain premium status and usage counts
      expect(result2.result.current.status).toBe('premium');
      expect(result2.result.current.usageLimits.oracleQuestions.todayCount).toBe(1);
      expect(result2.result.current.usageLimits.recipes.todayCount).toBe(1);
    });
  });

  describe('Usage Limit Scenarios', () => {
    // Test all predefined usage limit scenarios
    usageLimitTestScenarios.forEach(scenario => {
      it(`should handle ${scenario.name} correctly`, async () => {
        await runUsageLimitScenario(scenario);
      });
    });
  });

  describe('Subscription State Scenarios', () => {
    // Test all predefined subscription state scenarios
    subscriptionTestScenarios.forEach(scenario => {
      it(`should handle ${scenario.name} correctly`, async () => {
        mockRevenueCatService.setCustomerInfo(scenario.customerInfo);
        const result = setupSubscriptionStore(scenario.expectedStatus, scenario.customerInfo);
        
        // Verify status matches expected
        expect(result.current.status).toBe(scenario.expectedStatus);
        
        // Verify feature access based on status
        if (scenario.expectedStatus === 'premium') {
          expect(result.current.canAskOracleQuestion()).toBe(true);
          expect(result.current.canCreateRecipe()).toBe(true);
          expect(result.current.canTrack()).toBe(true);
          expect(result.current.getRemainingTrackingDays()).toBe(999);
        } else {
          // Free users should have limited access
          expect(result.current.getRemainingOracleQuestions()).toBeLessThanOrEqual(10);
          expect(result.current.getRemainingRecipes()).toBeLessThanOrEqual(1);
          expect(result.current.getRemainingTrackingDays()).toBeLessThanOrEqual(3);
        }
      });
    });
  });

  describe('Real-time Subscription Updates', () => {
    it('should update subscription status when customer info changes', async () => {
      const result = setupSubscriptionStore('free');
      
      // Start as free user
      expect(result.current.status).toBe('free');
      
      // Simulate customer info update (e.g., from RevenueCat listener)
      const premiumCustomerInfo = mockRevenueCatService.createPremiumCustomerInfo();
      
      act(() => {
        result.current.updateCustomerInfo(premiumCustomerInfo);
      });
      
      // Should immediately update to premium
      expect(result.current.status).toBe('premium');
      expect(result.current.customerInfo).toBe(premiumCustomerInfo);
    });

    it('should handle subscription expiration in real-time', async () => {
      const result = setupSubscriptionStore('premium', 
        mockRevenueCatService.createPremiumCustomerInfo()
      );
      
      // Start as premium user
      expect(result.current.status).toBe('premium');
      
      // Simulate subscription expiration
      const expiredCustomerInfo = mockRevenueCatService.createExpiredCustomerInfo();
      
      act(() => {
        result.current.updateCustomerInfo(expiredCustomerInfo);
      });
      
      // Should immediately update to free
      expect(result.current.status).toBe('free');
      expect(result.current.customerInfo).toBe(expiredCustomerInfo);
    });

    it('should handle subscription cancellation (but still active) in real-time', async () => {
      const result = setupSubscriptionStore('premium', 
        mockRevenueCatService.createPremiumCustomerInfo()
      );
      
      // Start as premium user
      expect(result.current.status).toBe('premium');
      
      // Simulate subscription cancellation (but still active until expiration)
      const cancelledCustomerInfo = mockRevenueCatService.createCancelledCustomerInfo();
      
      act(() => {
        result.current.updateCustomerInfo(cancelledCustomerInfo);
      });
      
      // Should remain premium until expiration
      expect(result.current.status).toBe('premium');
      expect(result.current.customerInfo).toBe(cancelledCustomerInfo);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle malformed customer info gracefully', async () => {
      const result = setupSubscriptionStore('free');
      
      // Test with various malformed customer info objects
      const malformedCustomerInfos = [
        null,
        undefined,
        {},
        { entitlements: null },
        { entitlements: undefined },
        { entitlements: {} },
        { entitlements: { active: null } },
        { entitlements: { active: undefined } },
        { entitlements: { active: {}, all: {} } },
      ];
      
      malformedCustomerInfos.forEach((malformedInfo, index) => {
        act(() => {
          result.current.updateCustomerInfo(malformedInfo as any);
        });
        
        // Should default to free status for malformed data
        expect(result.current.status).toBe('free');
      });
    });

    it('should maintain consistent state during concurrent operations', async () => {
      const result = setupSubscriptionStore('free');
      
      // Simulate concurrent usage limit updates
      act(() => {
        // Multiple simultaneous calls
        const promises = [
          result.current.incrementOracleQuestions(),
          result.current.incrementOracleQuestions(),
          result.current.incrementRecipeCount(),
          result.current.startTracking(),
        ];
        
        // All operations should complete without race conditions
        expect(promises.every(p => typeof p === 'boolean')).toBe(true);
      });
      
      // State should be consistent
      expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(2);
      expect(result.current.usageLimits.recipes.currentCount).toBe(1);
      expect(result.current.usageLimits.tracking.daysUsed).toBe(1);
    });

    it('should recover gracefully from storage errors', async () => {
      const result = setupSubscriptionStore('premium');
      
      // Should not crash when storage operations fail
      expect(() => {
        act(() => {
          result.current.incrementOracleQuestions();
          result.current.incrementRecipeCount();
          result.current.startTracking();
        });
      }).not.toThrow();
      
      // State should still be updated in memory
      expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(1);
      expect(result.current.usageLimits.recipes.todayCount).toBe(1);
      expect(result.current.usageLimits.tracking.daysUsed).toBe(1);
    });
  });
});