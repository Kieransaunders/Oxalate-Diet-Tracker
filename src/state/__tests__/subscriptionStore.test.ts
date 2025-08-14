import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../subscriptionStore';
import * as revenueCatConfig from '../../config/revenuecat';

// Mock the RevenueCat config functions
jest.mock('../../config/revenuecat', () => ({
  shouldBypassPremium: jest.fn(() => false),
  isTestingMode: jest.fn(() => false),
  createMockCustomerInfo: jest.fn(),
}));

// Mock react-native-purchases
const mockPurchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchaseProduct: jest.fn(),
  restorePurchases: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
};

jest.mock('react-native-purchases', () => ({
  default: mockPurchases,
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

describe('Subscription Store', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    
    // Reset RevenueCat config mocks
    (revenueCatConfig.shouldBypassPremium as jest.Mock).mockReturnValue(false);
    (revenueCatConfig.isTestingMode as jest.Mock).mockReturnValue(false);
    
    // Reset store state by clearing persistence
    useSubscriptionStore.persist.clearStorage();
  });

  describe('Initial State', () => {
    it('should initialize with free status and default usage limits', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      expect(result.current.status).toBe('free');
      expect(result.current.customerInfo).toBeNull();
      expect(result.current.offerings).toBeNull();
      expect(result.current.lastError).toBeNull();
      expect(result.current.isLoading).toBe(false);
      
      // Check initial usage limits
      expect(result.current.usageLimits.oracleQuestions.monthlyLimit).toBe(10);
      expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(0);
      expect(result.current.usageLimits.oracleQuestions.dailyLimit).toBe(40);
      expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(0);
      
      expect(result.current.usageLimits.recipes.freeLimit).toBe(1);
      expect(result.current.usageLimits.recipes.currentCount).toBe(0);
      expect(result.current.usageLimits.recipes.dailyLimit).toBe(10);
      expect(result.current.usageLimits.recipes.todayCount).toBe(0);
      
      expect(result.current.usageLimits.tracking.freeDays).toBe(3);
      expect(result.current.usageLimits.tracking.startDate).toBeNull();
      expect(result.current.usageLimits.tracking.daysUsed).toBe(0);
    });
  });

  describe('Usage Limit Methods - Oracle Questions', () => {
    describe('Free Users', () => {
      it('should allow Oracle questions within monthly limit', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Should be able to ask questions up to monthly limit
        for (let i = 0; i < 10; i++) {
          expect(result.current.incrementOracleQuestions()).toBe(true);
          expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(i + 1);
        }
        
        // Should be blocked after reaching limit
        expect(result.current.incrementOracleQuestions()).toBe(false);
        expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(10);
      });

      it('should reset monthly Oracle questions on new month', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Use up monthly limit
        for (let i = 0; i < 10; i++) {
          result.current.incrementOracleQuestions();
        }
        expect(result.current.incrementOracleQuestions()).toBe(false);
        
        // Mock new month by changing the last reset date
        act(() => {
          const newUsageLimits = {
            ...result.current.usageLimits,
            oracleQuestions: {
              ...result.current.usageLimits.oracleQuestions,
              lastMonthlyResetDate: '2023-01', // Previous month
            },
          };
          useSubscriptionStore.setState({ usageLimits: newUsageLimits });
        });
        
        // Should be able to ask questions again
        expect(result.current.incrementOracleQuestions()).toBe(true);
        expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(1);
      });

      it('should return correct remaining Oracle questions for free users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.getRemainingOracleQuestions()).toBe(10);
        
        result.current.incrementOracleQuestions();
        expect(result.current.getRemainingOracleQuestions()).toBe(9);
        
        // Use up all questions
        for (let i = 0; i < 9; i++) {
          result.current.incrementOracleQuestions();
        }
        expect(result.current.getRemainingOracleQuestions()).toBe(0);
      });

      it('should validate Oracle question permissions correctly', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.canAskOracleQuestion()).toBe(true);
        
        // Use up monthly limit
        for (let i = 0; i < 10; i++) {
          result.current.incrementOracleQuestions();
        }
        
        expect(result.current.canAskOracleQuestion()).toBe(false);
      });
    });

    describe('Premium Users', () => {
      beforeEach(() => {
        const { result } = renderHook(() => useSubscriptionStore());
        act(() => {
          useSubscriptionStore.setState({ status: 'premium' });
        });
      });

      it('should allow Oracle questions within daily limit for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Should be able to ask questions up to daily limit
        for (let i = 0; i < 40; i++) {
          expect(result.current.incrementOracleQuestions()).toBe(true);
          expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(i + 1);
        }
        
        // Should be blocked after reaching daily limit
        expect(result.current.incrementOracleQuestions()).toBe(false);
        expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(40);
      });

      it('should reset daily Oracle questions on new day for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Use up daily limit
        for (let i = 0; i < 40; i++) {
          result.current.incrementOracleQuestions();
        }
        expect(result.current.incrementOracleQuestions()).toBe(false);
        
        // Mock new day by changing the last reset date
        act(() => {
          const newUsageLimits = {
            ...result.current.usageLimits,
            oracleQuestions: {
              ...result.current.usageLimits.oracleQuestions,
              lastResetDate: '2023-01-01', // Previous day
            },
          };
          useSubscriptionStore.setState({ usageLimits: newUsageLimits });
        });
        
        // Should be able to ask questions again
        expect(result.current.incrementOracleQuestions()).toBe(true);
        expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(1);
      });

      it('should return correct remaining Oracle questions for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.getRemainingOracleQuestions()).toBe(40);
        
        result.current.incrementOracleQuestions();
        expect(result.current.getRemainingOracleQuestions()).toBe(39);
        
        // Use up all daily questions
        for (let i = 0; i < 39; i++) {
          result.current.incrementOracleQuestions();
        }
        expect(result.current.getRemainingOracleQuestions()).toBe(0);
      });
    });
  });

  describe('Usage Limit Methods - Recipes', () => {
    describe('Free Users', () => {
      it('should allow recipe creation within total limit', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Should be able to create 1 recipe
        expect(result.current.incrementRecipeCount()).toBe(true);
        expect(result.current.usageLimits.recipes.currentCount).toBe(1);
        
        // Should be blocked after reaching limit
        expect(result.current.incrementRecipeCount()).toBe(false);
        expect(result.current.usageLimits.recipes.currentCount).toBe(1);
      });

      it('should return correct remaining recipes for free users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.getRemainingRecipes()).toBe(1);
        
        result.current.incrementRecipeCount();
        expect(result.current.getRemainingRecipes()).toBe(0);
      });

      it('should validate recipe creation permissions correctly', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.canCreateRecipe()).toBe(true);
        
        result.current.incrementRecipeCount();
        expect(result.current.canCreateRecipe()).toBe(false);
      });
    });

    describe('Premium Users', () => {
      beforeEach(() => {
        const { result } = renderHook(() => useSubscriptionStore());
        act(() => {
          useSubscriptionStore.setState({ status: 'premium' });
        });
      });

      it('should allow recipe creation within daily limit for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Should be able to create recipes up to daily limit
        for (let i = 0; i < 10; i++) {
          expect(result.current.incrementRecipeCount()).toBe(true);
          expect(result.current.usageLimits.recipes.todayCount).toBe(i + 1);
        }
        
        // Should be blocked after reaching daily limit
        expect(result.current.incrementRecipeCount()).toBe(false);
        expect(result.current.usageLimits.recipes.todayCount).toBe(10);
      });

      it('should reset daily recipe count on new day for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Use up daily limit
        for (let i = 0; i < 10; i++) {
          result.current.incrementRecipeCount();
        }
        expect(result.current.incrementRecipeCount()).toBe(false);
        
        // Mock new day by changing the last reset date
        act(() => {
          const newUsageLimits = {
            ...result.current.usageLimits,
            recipes: {
              ...result.current.usageLimits.recipes,
              lastResetDate: '2023-01-01', // Previous day
            },
          };
          useSubscriptionStore.setState({ usageLimits: newUsageLimits });
        });
        
        // Should be able to create recipes again
        expect(result.current.incrementRecipeCount()).toBe(true);
        expect(result.current.usageLimits.recipes.todayCount).toBe(1);
      });

      it('should return correct remaining recipes for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.getRemainingRecipes()).toBe(10);
        
        result.current.incrementRecipeCount();
        expect(result.current.getRemainingRecipes()).toBe(9);
      });
    });
  });

  describe('Usage Limit Methods - Tracking', () => {
    describe('Free Users', () => {
      it('should allow tracking within 3-day limit', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Should be able to start tracking
        expect(result.current.startTracking()).toBe(true);
        expect(result.current.usageLimits.tracking.startDate).toBeTruthy();
        expect(result.current.usageLimits.tracking.daysUsed).toBe(1);
        
        // Should still be able to track within 3 days
        expect(result.current.canTrack()).toBe(true);
      });

      it('should block tracking after 3 days for free users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        // Start tracking 4 days ago
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        
        act(() => {
          const newUsageLimits = {
            ...result.current.usageLimits,
            tracking: {
              ...result.current.usageLimits.tracking,
              startDate: fourDaysAgo.toISOString().split('T')[0],
              daysUsed: 4,
            },
          };
          useSubscriptionStore.setState({ usageLimits: newUsageLimits });
        });
        
        expect(result.current.canTrack()).toBe(false);
        expect(result.current.startTracking()).toBe(false);
      });

      it('should return correct remaining tracking days', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.getRemainingTrackingDays()).toBe(3);
        
        result.current.startTracking();
        expect(result.current.getRemainingTrackingDays()).toBe(3); // Same day
        
        // Mock next day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        act(() => {
          const newUsageLimits = {
            ...result.current.usageLimits,
            tracking: {
              ...result.current.usageLimits.tracking,
              startDate: yesterday.toISOString().split('T')[0],
              daysUsed: 2,
            },
          };
          useSubscriptionStore.setState({ usageLimits: newUsageLimits });
        });
        
        expect(result.current.getRemainingTrackingDays()).toBe(2);
      });
    });

    describe('Premium Users', () => {
      beforeEach(() => {
        const { result } = renderHook(() => useSubscriptionStore());
        act(() => {
          useSubscriptionStore.setState({ status: 'premium' });
        });
      });

      it('should allow unlimited tracking for premium users', () => {
        const { result } = renderHook(() => useSubscriptionStore());
        
        expect(result.current.canTrack()).toBe(true);
        expect(result.current.startTracking()).toBe(true);
        expect(result.current.incrementTrackingDay()).toBe(true);
        expect(result.current.getRemainingTrackingDays()).toBe(999);
      });
    });
  });

  describe('Bypass Logic', () => {
    it('should bypass limits when shouldBypassPremium returns true', () => {
      (revenueCatConfig.shouldBypassPremium as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Should bypass all limits
      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.canTrack()).toBe(true);
      
      expect(result.current.getRemainingOracleQuestions()).toBe(999);
      expect(result.current.getRemainingRecipes()).toBe(999);
      
      // Should always return true for increment methods
      expect(result.current.incrementOracleQuestions()).toBe(true);
      expect(result.current.incrementRecipeCount()).toBe(true);
    });

    it('should set premium status when isTestingMode returns true', async () => {
      (revenueCatConfig.isTestingMode as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useSubscriptionStore());
      
      await act(async () => {
        await result.current.initializePurchases();
      });
      
      expect(result.current.status).toBe('premium');
    });

    it('should set premium status when shouldBypassPremium returns true', async () => {
      (revenueCatConfig.shouldBypassPremium as jest.Mock).mockReturnValue(true);
      
      const { result } = renderHook(() => useSubscriptionStore());
      
      await act(async () => {
        await result.current.initializePurchases();
      });
      
      expect(result.current.status).toBe('premium');
    });
  });

  describe('Daily and Monthly Reset Logic', () => {
    it('should reset daily limits correctly', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set up state with yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      act(() => {
        const newUsageLimits = {
          ...result.current.usageLimits,
          oracleQuestions: {
            ...result.current.usageLimits.oracleQuestions,
            todayCount: 5,
            lastResetDate: yesterdayString,
          },
          recipes: {
            ...result.current.usageLimits.recipes,
            todayCount: 3,
            lastResetDate: yesterdayString,
          },
        };
        useSubscriptionStore.setState({ usageLimits: newUsageLimits });
      });
      
      // Call reset daily limits
      act(() => {
        result.current.resetDailyLimits();
      });
      
      // Should reset counts and update dates
      expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(0);
      expect(result.current.usageLimits.recipes.todayCount).toBe(0);
      expect(result.current.usageLimits.oracleQuestions.lastResetDate).toBe(
        new Date().toISOString().split('T')[0]
      );
      expect(result.current.usageLimits.recipes.lastResetDate).toBe(
        new Date().toISOString().split('T')[0]
      );
    });

    it('should reset monthly limits correctly', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set up state with last month's date
      act(() => {
        const newUsageLimits = {
          ...result.current.usageLimits,
          oracleQuestions: {
            ...result.current.usageLimits.oracleQuestions,
            monthlyCount: 8,
            lastMonthlyResetDate: '2023-01', // Previous month
          },
        };
        useSubscriptionStore.setState({ usageLimits: newUsageLimits });
      });
      
      // Call reset monthly limits
      act(() => {
        result.current.resetMonthlyLimits();
      });
      
      // Should reset count and update date
      expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(0);
      expect(result.current.usageLimits.oracleQuestions.lastMonthlyResetDate).toBe(
        new Date().toISOString().substring(0, 7)
      );
    });

    it('should handle timezone edge cases in date calculations', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Test with different timezone scenarios
      const utcDate = new Date('2024-01-15T23:59:59.999Z');
      const localDateString = utcDate.toISOString().split('T')[0];
      
      // Mock Date to return specific time
      const originalDate = Date;
      global.Date = jest.fn(() => utcDate) as any;
      global.Date.now = originalDate.now;
      Object.setPrototypeOf(global.Date, originalDate);
      
      act(() => {
        result.current.resetDailyLimits();
      });
      
      expect(result.current.usageLimits.oracleQuestions.lastResetDate).toBe(localDateString);
      
      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('Subscription Status Management', () => {
    it('should update customer info and status correctly', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      const mockCustomerInfo = {
        entitlements: {
          active: {
            premium: {
              identifier: 'premium',
              isActive: true,
              willRenew: true,
              productIdentifier: 'monthly_premium',
            },
          },
          all: {},
        },
      };
      
      act(() => {
        result.current.updateCustomerInfo(mockCustomerInfo);
      });
      
      expect(result.current.status).toBe('premium');
      expect(result.current.customerInfo).toBe(mockCustomerInfo);
    });

    it('should set free status when no premium entitlement exists', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      const mockCustomerInfo = {
        entitlements: {
          active: {},
          all: {},
        },
      };
      
      act(() => {
        result.current.updateCustomerInfo(mockCustomerInfo);
      });
      
      expect(result.current.status).toBe('free');
      expect(result.current.customerInfo).toBe(mockCustomerInfo);
    });
  });
}); 
 describe('Purchase Flow Methods', () => {
    describe('initializePurchases', () => {
      it('should initialize successfully with premium customer info', async () => {
        const mockCustomerInfo = {
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
                isActive: true,
                willRenew: true,
                productIdentifier: 'monthly_premium',
              },
            },
            all: {},
          },
        };
        
        const mockOfferings = {
          all: {
            default: {
              monthly: { identifier: 'monthly_premium' },
              annual: { identifier: 'yearly_premium' },
            },
          },
        };
        
        mockPurchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);
        mockPurchases.getOfferings.mockResolvedValue(mockOfferings);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        await act(async () => {
          await result.current.initializePurchases();
        });
        
        expect(result.current.status).toBe('premium');
        expect(result.current.customerInfo).toBe(mockCustomerInfo);
        expect(result.current.offerings).toEqual(Object.values(mockOfferings.all));
      });

      it('should initialize successfully with free customer info', async () => {
        const mockCustomerInfo = {
          entitlements: {
            active: {},
            all: {},
          },
        };
        
        const mockOfferings = {
          all: {
            default: {
              monthly: { identifier: 'monthly_premium' },
              annual: { identifier: 'yearly_premium' },
            },
          },
        };
        
        mockPurchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);
        mockPurchases.getOfferings.mockResolvedValue(mockOfferings);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        await act(async () => {
          await result.current.initializePurchases();
        });
        
        expect(result.current.status).toBe('free');
        expect(result.current.customerInfo).toBe(mockCustomerInfo);
        expect(result.current.offerings).toEqual(Object.values(mockOfferings.all));
      });

      it('should handle initialization errors gracefully', async () => {
        const error = new Error('Network error');
        mockPurchases.getCustomerInfo.mockRejectedValue(error);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        await act(async () => {
          await result.current.initializePurchases();
        });
        
        expect(result.current.status).toBe('free');
        expect(result.current.customerInfo).toBeNull();
        expect(result.current.offerings).toBeNull();
      });

      it('should handle missing Purchases module gracefully', async () => {
        // Mock Purchases as null to simulate missing module
        jest.doMock('react-native-purchases', () => ({
          default: null,
        }));
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        await act(async () => {
          await result.current.initializePurchases();
        });
        
        expect(result.current.status).toBe('free');
      });

      it('should handle null offerings gracefully', async () => {
        const mockCustomerInfo = {
          entitlements: { active: {}, all: {} },
        };
        
        mockPurchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);
        mockPurchases.getOfferings.mockResolvedValue(null);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        await act(async () => {
          await result.current.initializePurchases();
        });
        
        expect(result.current.status).toBe('free');
        expect(result.current.offerings).toBeNull();
      });
    });

    describe('purchaseProduct', () => {
      it('should handle successful purchase and update to premium', async () => {
        const mockPurchaseResult = {
          customerInfo: {
            entitlements: {
              active: {
                premium: {
                  identifier: 'premium',
                  isActive: true,
                  willRenew: true,
                  productIdentifier: 'monthly_premium',
                },
              },
              all: {},
            },
          },
        };
        
        mockPurchases.purchaseProduct.mockResolvedValue(mockPurchaseResult);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let purchaseResult;
        await act(async () => {
          purchaseResult = await result.current.purchaseProduct('monthly_premium');
        });
        
        expect(purchaseResult).toBe(true);
        expect(result.current.status).toBe('premium');
        expect(result.current.customerInfo).toBe(mockPurchaseResult.customerInfo);
        expect(mockPurchases.purchaseProduct).toHaveBeenCalledWith('monthly_premium');
      });

      it('should handle failed purchase and maintain free status', async () => {
        const mockPurchaseResult = {
          customerInfo: {
            entitlements: {
              active: {},
              all: {},
            },
          },
        };
        
        mockPurchases.purchaseProduct.mockResolvedValue(mockPurchaseResult);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let purchaseResult;
        await act(async () => {
          purchaseResult = await result.current.purchaseProduct('monthly_premium');
        });
        
        expect(purchaseResult).toBe(false);
        expect(result.current.status).toBe('free');
        expect(result.current.customerInfo).toBe(mockPurchaseResult.customerInfo);
      });

      it('should handle purchase cancellation', async () => {
        const error = new Error('User cancelled') as any;
        error.code = 'PURCHASES_ERROR_USER_CANCELLED';
        mockPurchases.purchaseProduct.mockRejectedValue(error);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let purchaseResult;
        await act(async () => {
          purchaseResult = await result.current.purchaseProduct('monthly_premium');
        });
        
        expect(purchaseResult).toBe(false);
        expect(result.current.status).toBe('free');
      });

      it('should handle purchase errors gracefully', async () => {
        const error = new Error('Payment failed') as any;
        error.code = 'PURCHASES_ERROR_STORE_PROBLEM';
        mockPurchases.purchaseProduct.mockRejectedValue(error);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let purchaseResult;
        await act(async () => {
          purchaseResult = await result.current.purchaseProduct('monthly_premium');
        });
        
        expect(purchaseResult).toBe(false);
        expect(result.current.status).toBe('free');
      });

      it('should handle missing Purchases module in purchase flow', async () => {
        // Mock Purchases as null
        jest.doMock('react-native-purchases', () => ({
          default: null,
        }));
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let purchaseResult;
        await act(async () => {
          purchaseResult = await result.current.purchaseProduct('monthly_premium');
        });
        
        expect(purchaseResult).toBe(false);
      });
    });

    describe('restorePurchases', () => {
      it('should restore premium subscription successfully', async () => {
        const mockCustomerInfo = {
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
                isActive: true,
                willRenew: true,
                productIdentifier: 'yearly_premium',
              },
            },
            all: {},
          },
        };
        
        mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let restoreResult;
        await act(async () => {
          restoreResult = await result.current.restorePurchases();
        });
        
        expect(restoreResult).toBe(true);
        expect(result.current.status).toBe('premium');
        expect(result.current.customerInfo).toBe(mockCustomerInfo);
      });

      it('should handle restore with no active subscriptions', async () => {
        const mockCustomerInfo = {
          entitlements: {
            active: {},
            all: {},
          },
        };
        
        mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let restoreResult;
        await act(async () => {
          restoreResult = await result.current.restorePurchases();
        });
        
        expect(restoreResult).toBe(false);
        expect(result.current.status).toBe('free');
        expect(result.current.customerInfo).toBe(mockCustomerInfo);
      });

      it('should handle restore errors gracefully', async () => {
        const error = new Error('Restore failed');
        mockPurchases.restorePurchases.mockRejectedValue(error);
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let restoreResult;
        await act(async () => {
          restoreResult = await result.current.restorePurchases();
        });
        
        expect(restoreResult).toBe(false);
        expect(result.current.status).toBe('free');
      });

      it('should handle missing Purchases module in restore flow', async () => {
        // Mock Purchases as null
        jest.doMock('react-native-purchases', () => ({
          default: null,
        }));
        
        const { result } = renderHook(() => useSubscriptionStore());
        
        let restoreResult;
        await act(async () => {
          restoreResult = await result.current.restorePurchases();
        });
        
        expect(restoreResult).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent usage limit updates correctly', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Simulate concurrent calls
      act(() => {
        result.current.incrementOracleQuestions();
        result.current.incrementOracleQuestions();
        result.current.incrementOracleQuestions();
      });
      
      expect(result.current.usageLimits.oracleQuestions.monthlyCount).toBe(3);
    });

    it('should handle invalid date strings gracefully', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set invalid date
      act(() => {
        const newUsageLimits = {
          ...result.current.usageLimits,
          tracking: {
            ...result.current.usageLimits.tracking,
            startDate: 'invalid-date',
          },
        };
        useSubscriptionStore.setState({ usageLimits: newUsageLimits });
      });
      
      // Should handle gracefully and not crash
      expect(() => result.current.canTrack()).not.toThrow();
      expect(() => result.current.getRemainingTrackingDays()).not.toThrow();
    });

    it('should handle negative usage counts gracefully', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set negative counts
      act(() => {
        const newUsageLimits = {
          ...result.current.usageLimits,
          oracleQuestions: {
            ...result.current.usageLimits.oracleQuestions,
            monthlyCount: -5,
            todayCount: -3,
          },
          recipes: {
            ...result.current.usageLimits.recipes,
            currentCount: -2,
            todayCount: -1,
          },
        };
        useSubscriptionStore.setState({ usageLimits: newUsageLimits });
      });
      
      // Should return non-negative remaining counts
      expect(result.current.getRemainingOracleQuestions()).toBeGreaterThanOrEqual(0);
      expect(result.current.getRemainingRecipes()).toBeGreaterThanOrEqual(0);
      expect(result.current.getRemainingTrackingDays()).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed customer info gracefully', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Test with null entitlements
      act(() => {
        result.current.updateCustomerInfo({ entitlements: null } as any);
      });
      
      expect(result.current.status).toBe('free');
      
      // Test with undefined entitlements
      act(() => {
        result.current.updateCustomerInfo({ entitlements: undefined } as any);
      });
      
      expect(result.current.status).toBe('free');
      
      // Test with missing active property
      act(() => {
        result.current.updateCustomerInfo({ entitlements: { all: {} } } as any);
      });
      
      expect(result.current.status).toBe('free');
    });

    it('should handle state persistence errors gracefully', async () => {
      // Mock AsyncStorage to throw error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Should not crash when state changes
      expect(() => {
        act(() => {
          result.current.incrementOracleQuestions();
        });
      }).not.toThrow();
    });
  });
});