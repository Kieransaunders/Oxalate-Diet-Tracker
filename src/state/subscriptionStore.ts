import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { shouldBypassPremium, isTestingMode } from '../config/revenuecat';
import { withRetry, mapRevenueCatError, handleSubscriptionError, type SubscriptionError } from '../utils/subscription-errors';
import { toast } from '../utils/toast';

// Dynamic import to handle cases where native module isn't available
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesOffering: any = null;

try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const PurchasesModule = require('react-native-purchases');
    Purchases = PurchasesModule.default;
    // CustomerInfo and PurchasesOffering are for type reference only
    // CustomerInfo = PurchasesModule.CustomerInfo;
    // PurchasesOffering = PurchasesModule.PurchasesOffering;
  }
} catch (error) {
  console.warn('react-native-purchases not available:', error);
}

export type SubscriptionStatus = 'free' | 'premium' | 'loading';

// Type definitions that work even when native module isn't available
type CustomerInfoType = any;
type PurchasesOfferingType = any;

interface UsageLimits {
  oracleQuestions: {
    // Free tier: 10 questions per month
    monthlyLimit: number;
    monthlyCount: number;
    lastMonthlyResetDate: string; // ISO date string (YYYY-MM)
    // Premium tier: 40 questions per day
    dailyLimit: number;
    todayCount: number;
    lastResetDate: string; // ISO date string
  };
  recipes: {
    freeLimit: number;
    currentCount: number;
    // Premium tier: 10 recipes per day
    dailyLimit: number;
    todayCount: number;
    lastResetDate: string; // ISO date string
  };
  tracking: {
    freeDays: number;
    startDate: string | null; // ISO date string when first tracking started
    daysUsed: number;
  };
}

interface SubscriptionStore {
  // Subscription state
  status: SubscriptionStatus;
  customerInfo: CustomerInfoType | null;
  offerings: PurchasesOfferingType[] | null;
  
  // Error state
  lastError: SubscriptionError | null;
  isLoading: boolean;
  
  // Usage tracking
  usageLimits: UsageLimits;
  
  // Actions
  initializePurchases: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchaseProduct: (productId: string) => Promise<boolean>;
  updateCustomerInfo: (info: CustomerInfoType) => void;
  clearError: () => void;
  
  // Usage tracking actions
  incrementOracleQuestions: () => boolean; // Returns true if under limit
  incrementRecipeCount: () => boolean; // Returns true if under limit
  startTracking: () => boolean; // Returns true if within 7-day limit
  incrementTrackingDay: () => boolean; // Returns true if within 7-day limit
  
  // Usage check methods
  canAskOracleQuestion: () => boolean;
  canCreateRecipe: () => boolean;
  canTrack: () => boolean;
  getRemainingOracleQuestions: () => number;
  getRemainingRecipes: () => number;
  getRemainingTrackingDays: () => number;
  
  // Reset methods
  resetDailyLimits: () => void;
  resetMonthlyLimits: () => void;
}

const getInitialUsageLimits = (): UsageLimits => ({
  oracleQuestions: {
    // Free tier: 10 questions per month
    monthlyLimit: 10,
    monthlyCount: 0,
    lastMonthlyResetDate: new Date().toISOString().substring(0, 7), // Current month (YYYY-MM)
    // Premium tier: 40 questions per day
    dailyLimit: 40,
    todayCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0], // Today's date
  },
  recipes: {
    freeLimit: 1,
    currentCount: 0,
    // Premium tier: 10 recipes per day
    dailyLimit: 10,
    todayCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0], // Today's date
  },
  tracking: {
    freeDays: 3, // Changed from 7 to 3 days
    startDate: null,
    daysUsed: 0,
  },
});

const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
};

const isCurrentMonth = (monthString: string): boolean => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  return monthString === currentMonth;
};

const getDaysDifference = (startDate: string): number => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      status: 'free', // Default to free for proper testing
      customerInfo: null,
      offerings: null,
      lastError: null,
      isLoading: false,
      usageLimits: getInitialUsageLimits(),

      clearError: () => {
        set({ lastError: null });
      },

      initializePurchases: async () => {
        set({ isLoading: true, lastError: null });
        
        try {
          if (!Purchases) {
            console.warn('Purchases module not available, setting to free status');
            set({ status: 'free', isLoading: false });
            return;
          }
          
          // Check if testing mode or development bypasses are enabled
          if (shouldBypassPremium() || isTestingMode()) {
            console.log('Running in testing/bypass mode - setting premium status');
            set({ status: 'premium', isLoading: false });
            return;
          }
          
          await withRetry(async () => {
            // Get customer info and offerings
            const customerInfo = await Purchases.getCustomerInfo();
            const offerings = await Purchases.getOfferings();
            const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
            
            console.log('Customer info retrieved:', {
              isPremium,
              activeEntitlements: Object.keys(customerInfo.entitlements.active),
              allEntitlements: Object.keys(customerInfo.entitlements.all),
            });
            
            set({
              status: isPremium ? 'premium' : 'free',
              customerInfo,
              offerings: offerings ? Object.values(offerings.all) : null,
              isLoading: false,
              lastError: null,
            });
            
            console.log(`Subscription status initialized: ${isPremium ? 'premium' : 'free'}`);
          }, { maxRetries: 2 });
          
        } catch (error) {
          const mappedError = mapRevenueCatError(error);
          console.error('Failed to initialize purchases:', mappedError);
          
          // Set error state but don't show toast for initialization failures
          // as this is usually done silently in the background
          set({ 
            status: 'free',
            lastError: mappedError,
            isLoading: false 
          });
        }
      },

      restorePurchases: async () => {
        set({ isLoading: true, lastError: null });
        
        try {
          if (!Purchases) {
            console.warn('Purchases module not available');
            set({ isLoading: false });
            toast.error('Feature Unavailable', 'Purchase restoration is not available on this platform.');
            return false;
          }
          
          const result = await withRetry(async () => {
            const customerInfo = await Purchases.restorePurchases();
            const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
            
            set({
              status: isPremium ? 'premium' : 'free',
              customerInfo,
              isLoading: false,
              lastError: null,
            });
            
            return isPremium;
          }, { maxRetries: 2 });
          
          if (result) {
            toast.success(
              'Purchases Restored!',
              'Your premium subscription has been restored successfully.'
            );
          } else {
            toast.info(
              'No Purchases Found',
              'No previous purchases were found for this account.'
            );
          }
          
          return result;
          
        } catch (error) {
          const mappedError = mapRevenueCatError(error);
          set({ 
            lastError: mappedError,
            isLoading: false 
          });
          
          handleSubscriptionError(mappedError, () => {
            // Retry restore purchases
            get().restorePurchases();
          });
          
          return false;
        }
      },

      purchaseProduct: async (productId: string) => {
        set({ isLoading: true, lastError: null });
        
        try {
          if (!Purchases) {
            console.warn('Purchases module not available');
            set({ isLoading: false });
            toast.error('Feature Unavailable', 'Purchases are not available on this platform.');
            return false;
          }
          
          const result = await withRetry(async () => {
            const purchaseResult = await Purchases.purchaseProduct(productId);
            const isPremium = purchaseResult.customerInfo.entitlements.active['premium'] !== undefined;
            
            set({
              status: isPremium ? 'premium' : 'free',
              customerInfo: purchaseResult.customerInfo,
              isLoading: false,
              lastError: null,
            });
            
            return isPremium;
          }, { maxRetries: 1 }); // Fewer retries for purchases to avoid double charges
          
          if (result) {
            toast.success(
              'Welcome to Premium!',
              'Thank you for upgrading. You now have unlimited access to all features.'
            );
          }
          
          return result;
          
        } catch (error) {
          const mappedError = mapRevenueCatError(error);
          set({ 
            lastError: mappedError,
            isLoading: false 
          });
          
          // Special handling for product already purchased error
          if (mappedError.code === 'PRODUCT_ALREADY_PURCHASED_ERROR') {
            handleSubscriptionError(mappedError, () => {
              // Retry with restore purchases instead
              get().restorePurchases();
            });
          } else {
            handleSubscriptionError(mappedError, () => {
              // Retry purchase
              get().purchaseProduct(productId);
            });
          }
          
          return false;
        }
      },

      updateCustomerInfo: (info: CustomerInfoType) => {
        const isPremium = info.entitlements.active['premium'] !== undefined;
        set({
          status: isPremium ? 'premium' : 'free',
          customerInfo: info,
        });
      },

      incrementOracleQuestions: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode or premium users
        if (shouldBypassPremium() || status === 'premium') {
          const today = new Date().toISOString().split('T')[0];
          
          // Check daily limit for premium users
          if (status === 'premium' && !shouldBypassPremium()) {
            const { dailyLimit, todayCount, lastResetDate } = usageLimits.oracleQuestions;
            
            // Reset daily counter if it's a new day
            if (lastResetDate !== today) {
              set({
                usageLimits: {
                  ...usageLimits,
                  oracleQuestions: {
                    ...usageLimits.oracleQuestions,
                    todayCount: 0,
                    lastResetDate: today,
                  },
                },
              });
            }
            
            if (get().usageLimits.oracleQuestions.todayCount >= dailyLimit) {
              return false;
            }
            
            // Increment premium daily count
            set({
              usageLimits: {
                ...get().usageLimits,
                oracleQuestions: {
                  ...get().usageLimits.oracleQuestions,
                  todayCount: get().usageLimits.oracleQuestions.todayCount + 1,
                },
              },
            });
            return true;
          }
          
          // Bypass mode - always allow
          return true;
        }
        
        // Free tier - check monthly limit
        const { monthlyLimit, lastMonthlyResetDate } = usageLimits.oracleQuestions;
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        // Reset monthly counter if it's a new month
        if (lastMonthlyResetDate !== currentMonth) {
          set({
            usageLimits: {
              ...usageLimits,
              oracleQuestions: {
                ...usageLimits.oracleQuestions,
                monthlyCount: 0,
                lastMonthlyResetDate: currentMonth,
              },
            },
          });
        }
        
        const currentLimits = get().usageLimits.oracleQuestions;
        if (currentLimits.monthlyCount >= monthlyLimit) {
          return false;
        }
        
        // Increment monthly count
        set({
          usageLimits: {
            ...get().usageLimits,
            oracleQuestions: {
              ...get().usageLimits.oracleQuestions,
              monthlyCount: currentLimits.monthlyCount + 1,
            },
          },
        });
        
        return true;
      },

      incrementRecipeCount: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode
        if (shouldBypassPremium()) {
          return true;
        }
        
        // Premium users - check daily limit
        if (status === 'premium') {
          const today = new Date().toISOString().split('T')[0];
          const { dailyLimit, lastResetDate } = usageLimits.recipes;
          
          // Reset daily counter if it's a new day
          if (lastResetDate !== today) {
            set({
              usageLimits: {
                ...usageLimits,
                recipes: {
                  ...usageLimits.recipes,
                  todayCount: 0,
                  lastResetDate: today,
                },
              },
            });
          }
          
          const currentLimits = get().usageLimits.recipes;
          if (currentLimits.todayCount >= dailyLimit) {
            return false;
          }
          
          // Increment daily count
          set({
            usageLimits: {
              ...get().usageLimits,
              recipes: {
                ...get().usageLimits.recipes,
                todayCount: currentLimits.todayCount + 1,
              },
            },
          });
          
          return true;
        }
        
        // Free tier - check total limit
        const { freeLimit, currentCount } = usageLimits.recipes;
        if (currentCount >= freeLimit) {
          return false;
        }
        
        // Increment total count for free users
        set({
          usageLimits: {
            ...usageLimits,
            recipes: {
              ...usageLimits.recipes,
              currentCount: currentCount + 1,
            },
          },
        });
        
        return true;
      },

      startTracking: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        // If no tracking has started yet, start now
        if (!usageLimits.tracking.startDate) {
          const today = new Date().toISOString().split('T')[0];
          set({
            usageLimits: {
              ...usageLimits,
              tracking: {
                ...usageLimits.tracking,
                startDate: today,
                daysUsed: 1,
              },
            },
          });
          return true;
        }
        
        // Check if still within the 7-day limit
        const daysSinceStart = getDaysDifference(usageLimits.tracking.startDate);
        return daysSinceStart <= usageLimits.tracking.freeDays;
      },

      incrementTrackingDay: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        if (!usageLimits.tracking.startDate) {
          return get().startTracking();
        }
        
        const daysSinceStart = getDaysDifference(usageLimits.tracking.startDate);
        
        if (daysSinceStart > usageLimits.tracking.freeDays) {
          return false;
        }
        
        set({
          usageLimits: {
            ...usageLimits,
            tracking: {
              ...usageLimits.tracking,
              daysUsed: Math.max(usageLimits.tracking.daysUsed, daysSinceStart),
            },
          },
        });
        
        return true;
      },

      canAskOracleQuestion: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode
        if (shouldBypassPremium()) return true;
        
        // Premium users - check daily limit
        if (status === 'premium') {
          const { dailyLimit, lastResetDate } = usageLimits.oracleQuestions;
          const today = new Date().toISOString().split('T')[0];
          
          // Reset daily counter if it's a new day
          if (lastResetDate !== today) {
            get().resetDailyLimits();
            return get().usageLimits.oracleQuestions.todayCount < dailyLimit;
          }
          
          return todayCount < dailyLimit;
        }
        
        // Free users - check monthly limit
        const { monthlyLimit, monthlyCount, lastMonthlyResetDate } = usageLimits.oracleQuestions;
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        // Reset monthly counter if it's a new month
        if (lastMonthlyResetDate !== currentMonth) {
          get().resetMonthlyLimits();
          return get().usageLimits.oracleQuestions.monthlyCount < monthlyLimit;
        }
        
        return monthlyCount < monthlyLimit;
      },

      canCreateRecipe: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode
        if (shouldBypassPremium()) return true;
        
        // Premium users - check daily limit
        if (status === 'premium') {
          const { dailyLimit, todayCount, lastResetDate } = usageLimits.recipes;
          const today = new Date().toISOString().split('T')[0];
          
          // Reset daily counter if it's a new day
          if (lastResetDate !== today) {
            get().resetDailyLimits();
            return get().usageLimits.recipes.todayCount < dailyLimit;
          }
          
          return todayCount < dailyLimit;
        }
        
        // Free users - check total limit
        return usageLimits.recipes.currentCount < usageLimits.recipes.freeLimit;
      },

      canTrack: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode or premium users
        if (shouldBypassPremium() || status === 'premium') return true;
        
        if (!usageLimits.tracking.startDate) return true;
        
        const daysSinceStart = getDaysDifference(usageLimits.tracking.startDate);
        return daysSinceStart <= usageLimits.tracking.freeDays;
      },

      getRemainingOracleQuestions: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode
        if (shouldBypassPremium()) return 999;
        
        // Premium users - daily limit
        if (status === 'premium') {
          const { dailyLimit, todayCount, lastResetDate } = usageLimits.oracleQuestions;
          const today = new Date().toISOString().split('T')[0];
          
          // If it's a new day, return full daily limit
          if (lastResetDate !== today) {
            return dailyLimit;
          }
          
          return Math.max(0, dailyLimit - todayCount);
        }
        
        // Free users - monthly limit
        const { monthlyLimit, monthlyCount, lastMonthlyResetDate } = usageLimits.oracleQuestions;
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        // If it's a new month, return full monthly limit
        if (lastMonthlyResetDate !== currentMonth) {
          return monthlyLimit;
        }
        
        return Math.max(0, monthlyLimit - monthlyCount);
      },

      getRemainingRecipes: () => {
        const { status, usageLimits } = get();
        
        // Bypass for testing mode
        if (shouldBypassPremium()) return 999;
        
        // Premium users - daily limit
        if (status === 'premium') {
          const { dailyLimit, todayCount, lastResetDate } = usageLimits.recipes;
          const today = new Date().toISOString().split('T')[0];
          
          // If it's a new day, return full daily limit
          if (lastResetDate !== today) {
            return dailyLimit;
          }
          
          return Math.max(0, dailyLimit - todayCount);
        }
        
        // Free users - total limit
        return Math.max(0, usageLimits.recipes.freeLimit - usageLimits.recipes.currentCount);
      },

      getRemainingTrackingDays: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return 999; // Unlimited
        
        if (!usageLimits.tracking.startDate) return usageLimits.tracking.freeDays;
        
        const daysSinceStart = getDaysDifference(usageLimits.tracking.startDate);
        return Math.max(0, usageLimits.tracking.freeDays - daysSinceStart + 1);
      },

      resetDailyLimits: () => {
        const { usageLimits } = get();
        const today = new Date().toISOString().split('T')[0];
        
        let updated = false;
        const newUsageLimits = { ...usageLimits };
        
        // Reset Oracle daily limits (for premium users)
        if (!isToday(usageLimits.oracleQuestions.lastResetDate)) {
          newUsageLimits.oracleQuestions = {
            ...newUsageLimits.oracleQuestions,
            todayCount: 0,
            lastResetDate: today,
          };
          updated = true;
        }
        
        // Reset Recipe daily limits (for premium users)
        if (!isToday(usageLimits.recipes.lastResetDate)) {
          newUsageLimits.recipes = {
            ...newUsageLimits.recipes,
            todayCount: 0,
            lastResetDate: today,
          };
          updated = true;
        }
        
        if (updated) {
          set({ usageLimits: newUsageLimits });
        }
      },
      
      resetMonthlyLimits: () => {
        const { usageLimits } = get();
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        if (!isCurrentMonth(usageLimits.oracleQuestions.lastMonthlyResetDate)) {
          set({
            usageLimits: {
              ...usageLimits,
              oracleQuestions: {
                ...usageLimits.oracleQuestions,
                monthlyCount: 0,
                lastMonthlyResetDate: currentMonth,
              },
            },
          });
        }
      },
    }),
    {
      name: 'subscription-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);