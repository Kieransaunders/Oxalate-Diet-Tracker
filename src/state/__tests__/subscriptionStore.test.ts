import { act, renderHook } from '@testing-library/react-native';
import { useSubscriptionStore } from '../subscriptionStore';
import { createMockCustomerInfo, createMockAsyncStorage } from '../../test-utils';
import Purchases from 'react-native-purchases';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => createMockAsyncStorage());

// Mock RevenueCat
const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

describe('subscriptionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    act(() => {
      const store = useSubscriptionStore.getState();
      useSubscriptionStore.setState({
        status: 'loading',
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

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      expect(result.current.status).toBe('loading');
      expect(result.current.customerInfo).toBeNull();
      expect(result.current.offerings).toBeNull();
      expect(result.current.usageLimits.oracleQuestions.dailyLimit).toBe(5);
      expect(result.current.usageLimits.recipes.freeLimit).toBe(1);
      expect(result.current.usageLimits.tracking.freeDays).toBe(7);
    });
  });

  describe('initializePurchases', () => {
    it('should initialize with free status when not premium', async () => {
      const mockCustomerInfo = createMockCustomerInfo();
      mockPurchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);
      mockPurchases.getOfferings.mockResolvedValue({ all: {} });

      const { result } = renderHook(() => useSubscriptionStore());

      await act(async () => {
        await result.current.initializePurchases();
      });

      expect(result.current.status).toBe('free');
      expect(result.current.customerInfo).toBe(mockCustomerInfo);
    });

    it('should initialize with premium status when premium is active', async () => {
      const mockCustomerInfo = createMockCustomerInfo({
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
      mockPurchases.getCustomerInfo.mockResolvedValue(mockCustomerInfo);
      mockPurchases.getOfferings.mockResolvedValue({ all: {} });

      const { result } = renderHook(() => useSubscriptionStore());

      await act(async () => {
        await result.current.initializePurchases();
      });

      expect(result.current.status).toBe('premium');
    });

    it('should handle initialization error', async () => {
      mockPurchases.getCustomerInfo.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSubscriptionStore());

      await act(async () => {
        await result.current.initializePurchases();
      });

      expect(result.current.status).toBe('free');
    });
  });

  describe('Oracle questions usage tracking', () => {
    it('should allow oracle questions when under daily limit', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set to free status
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.getRemainingOracleQuestions()).toBe(5);
    });

    it('should increment oracle question count', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set to free status
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      act(() => {
        const success = result.current.incrementOracleQuestions();
        expect(success).toBe(true);
      });

      expect(result.current.getRemainingOracleQuestions()).toBe(4);
      expect(result.current.usageLimits.oracleQuestions.todayCount).toBe(1);
    });

    it('should block oracle questions when daily limit reached', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set to free status and use all questions
      act(() => {
        useSubscriptionStore.setState({ 
          status: 'free',
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            oracleQuestions: {
              dailyLimit: 5,
              todayCount: 5,
              lastResetDate: new Date().toISOString().split('T')[0],
            },
          },
        });
      });

      expect(result.current.canAskOracleQuestion()).toBe(false);
      expect(result.current.getRemainingOracleQuestions()).toBe(0);
      
      act(() => {
        const success = result.current.incrementOracleQuestions();
        expect(success).toBe(false);
      });
    });

    it('should reset oracle questions on new day', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Set to free status with yesterday's date
      act(() => {
        useSubscriptionStore.setState({ 
          status: 'free',
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            oracleQuestions: {
              dailyLimit: 5,
              todayCount: 5,
              lastResetDate: yesterday.toISOString().split('T')[0],
            },
          },
        });
      });

      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.getRemainingOracleQuestions()).toBe(5);
    });

    it('should allow unlimited oracle questions for premium users', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      expect(result.current.canAskOracleQuestion()).toBe(true);
      expect(result.current.getRemainingOracleQuestions()).toBe(999);
      
      act(() => {
        const success = result.current.incrementOracleQuestions();
        expect(success).toBe(true);
      });
    });
  });

  describe('Recipe creation usage tracking', () => {
    it('should allow recipe creation when under limit', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.getRemainingRecipes()).toBe(1);
    });

    it('should increment recipe count', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      act(() => {
        const success = result.current.incrementRecipeCount();
        expect(success).toBe(true);
      });

      expect(result.current.getRemainingRecipes()).toBe(0);
      expect(result.current.usageLimits.recipes.currentCount).toBe(1);
    });

    it('should block recipe creation when limit reached', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ 
          status: 'free',
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            recipes: {
              freeLimit: 1,
              currentCount: 1,
            },
          },
        });
      });

      expect(result.current.canCreateRecipe()).toBe(false);
      expect(result.current.getRemainingRecipes()).toBe(0);
      
      act(() => {
        const success = result.current.incrementRecipeCount();
        expect(success).toBe(false);
      });
    });

    it('should allow unlimited recipes for premium users', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      expect(result.current.canCreateRecipe()).toBe(true);
      expect(result.current.getRemainingRecipes()).toBe(999);
      
      act(() => {
        const success = result.current.incrementRecipeCount();
        expect(success).toBe(true);
      });
    });
  });

  describe('Tracking usage', () => {
    it('should allow tracking when not started', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      expect(result.current.canTrack()).toBe(true);
      expect(result.current.getRemainingTrackingDays()).toBe(7);
    });

    it('should start tracking on first use', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'free' });
      });

      act(() => {
        const success = result.current.startTracking();
        expect(success).toBe(true);
      });

      expect(result.current.usageLimits.tracking.startDate).toBe(
        new Date().toISOString().split('T')[0]
      );
      expect(result.current.usageLimits.tracking.daysUsed).toBe(1);
      expect(result.current.getRemainingTrackingDays()).toBe(7);
    });

    it('should increment tracking days', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set tracking as started yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      act(() => {
        useSubscriptionStore.setState({ 
          status: 'free',
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            tracking: {
              freeDays: 7,
              startDate: yesterday.toISOString().split('T')[0],
              daysUsed: 1,
            },
          },
        });
      });

      act(() => {
        const success = result.current.incrementTrackingDay();
        expect(success).toBe(true);
      });

      expect(result.current.usageLimits.tracking.daysUsed).toBe(2);
    });

    it('should block tracking after 7 days', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      // Set tracking as started 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      
      act(() => {
        useSubscriptionStore.setState({ 
          status: 'free',
          usageLimits: {
            ...useSubscriptionStore.getState().usageLimits,
            tracking: {
              freeDays: 7,
              startDate: eightDaysAgo.toISOString().split('T')[0],
              daysUsed: 7,
            },
          },
        });
      });

      expect(result.current.canTrack()).toBe(false);
      expect(result.current.getRemainingTrackingDays()).toBe(0);
      
      act(() => {
        const success = result.current.incrementTrackingDay();
        expect(success).toBe(false);
      });
    });

    it('should allow unlimited tracking for premium users', () => {
      const { result } = renderHook(() => useSubscriptionStore());
      
      act(() => {
        useSubscriptionStore.setState({ status: 'premium' });
      });

      expect(result.current.canTrack()).toBe(true);
      expect(result.current.getRemainingTrackingDays()).toBe(999);
      
      act(() => {
        const success = result.current.startTracking();
        expect(success).toBe(true);
      });
    });
  });

  describe('restorePurchases', () => {
    it('should restore premium status', async () => {
      const mockCustomerInfo = createMockCustomerInfo({
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
      mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const { result } = renderHook(() => useSubscriptionStore());

      let restored = false;
      await act(async () => {
        restored = await result.current.restorePurchases();
      });

      expect(restored).toBe(true);
      expect(result.current.status).toBe('premium');
    });

    it('should return false when no purchases to restore', async () => {
      const mockCustomerInfo = createMockCustomerInfo();
      mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const { result } = renderHook(() => useSubscriptionStore());

      let restored = false;
      await act(async () => {
        restored = await result.current.restorePurchases();
      });

      expect(restored).toBe(false);
      expect(result.current.status).toBe('free');
    });
  });

  describe('purchaseProduct', () => {
    it('should purchase product and update status', async () => {
      const mockCustomerInfo = createMockCustomerInfo({
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
        customerInfo: mockCustomerInfo,
        productIdentifier: 'oxalate_premium_monthly',
        transactionIdentifier: 'test-transaction',
      });

      const { result } = renderHook(() => useSubscriptionStore());

      let purchased = false;
      await act(async () => {
        purchased = await result.current.purchaseProduct('oxalate_premium_monthly');
      });

      expect(purchased).toBe(true);
      expect(result.current.status).toBe('premium');
    });

    it('should handle purchase failure', async () => {
      mockPurchases.purchaseProduct.mockRejectedValue(new Error('Purchase failed'));

      const { result } = renderHook(() => useSubscriptionStore());

      let purchased = true;
      await act(async () => {
        purchased = await result.current.purchaseProduct('oxalate_premium_monthly');
      });

      expect(purchased).toBe(false);
    });
  });
});