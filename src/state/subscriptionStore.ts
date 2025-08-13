import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamic import to handle cases where native module isn't available
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesOffering: any = null;

try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const PurchasesModule = require('react-native-purchases');
    Purchases = PurchasesModule.default;
    CustomerInfo = PurchasesModule.CustomerInfo;
    PurchasesOffering = PurchasesModule.PurchasesOffering;
  }
} catch (error) {
  console.warn('react-native-purchases not available:', error);
}

export type SubscriptionStatus = 'free' | 'premium' | 'loading';

// Type definitions that work even when native module isn't available
type CustomerInfo = any;
type PurchasesOffering = any;

interface UsageLimits {
  oracleQuestions: {
    dailyLimit: number;
    todayCount: number;
    lastResetDate: string; // ISO date string
  };
  recipes: {
    freeLimit: number;
    currentCount: number;
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
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;
  
  // Usage tracking
  usageLimits: UsageLimits;
  
  // Actions
  initializePurchases: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchaseProduct: (productId: string) => Promise<boolean>;
  updateCustomerInfo: (info: CustomerInfo) => void;
  
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
}

const getInitialUsageLimits = (): UsageLimits => ({
  oracleQuestions: {
    dailyLimit: 5,
    todayCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0], // Today's date
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
});

const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
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
      status: 'loading',
      customerInfo: null,
      offerings: null,
      usageLimits: getInitialUsageLimits(),

      initializePurchases: async () => {
        try {
          set({ status: 'loading' });
          
          if (!Purchases) {
            console.warn('Purchases module not available, setting to free tier');
            set({ status: 'free' });
            return;
          }
          
          // Will be configured when RevenueCat is set up
          const customerInfo = await Purchases.getCustomerInfo();
          const offerings = await Purchases.getOfferings();
          
          const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
          
          set({
            status: isPremium ? 'premium' : 'free',
            customerInfo,
            offerings: offerings.all ? Object.values(offerings.all) : null,
          });
          
          // Reset daily limits if needed
          get().resetDailyLimits();
        } catch (error) {
          console.error('Failed to initialize purchases:', error);
          set({ status: 'free' });
        }
      },

      restorePurchases: async () => {
        try {
          if (!Purchases) {
            console.warn('Purchases module not available');
            return false;
          }
          
          const customerInfo = await Purchases.restorePurchases();
          const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
          
          set({
            status: isPremium ? 'premium' : 'free',
            customerInfo,
          });
          
          return isPremium;
        } catch (error) {
          console.error('Failed to restore purchases:', error);
          return false;
        }
      },

      purchaseProduct: async (productId: string) => {
        try {
          if (!Purchases) {
            console.warn('Purchases module not available');
            return false;
          }
          
          const purchaseResult = await Purchases.purchaseProduct(productId);
          const isPremium = purchaseResult.customerInfo.entitlements.active['premium'] !== undefined;
          
          set({
            status: isPremium ? 'premium' : 'free',
            customerInfo: purchaseResult.customerInfo,
          });
          
          return isPremium;
        } catch (error) {
          console.error('Failed to purchase product:', error);
          return false;
        }
      },

      updateCustomerInfo: (info: CustomerInfo) => {
        const isPremium = info.entitlements.active['premium'] !== undefined;
        set({
          status: isPremium ? 'premium' : 'free',
          customerInfo: info,
        });
      },

      incrementOracleQuestions: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        // Reset daily count if it's a new day
        if (!isToday(usageLimits.oracleQuestions.lastResetDate)) {
          set({
            usageLimits: {
              ...usageLimits,
              oracleQuestions: {
                ...usageLimits.oracleQuestions,
                todayCount: 0,
                lastResetDate: new Date().toISOString().split('T')[0],
              },
            },
          });
        }
        
        const updatedLimits = get().usageLimits;
        if (updatedLimits.oracleQuestions.todayCount >= updatedLimits.oracleQuestions.dailyLimit) {
          return false;
        }
        
        set({
          usageLimits: {
            ...updatedLimits,
            oracleQuestions: {
              ...updatedLimits.oracleQuestions,
              todayCount: updatedLimits.oracleQuestions.todayCount + 1,
            },
          },
        });
        
        return true;
      },

      incrementRecipeCount: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        if (usageLimits.recipes.currentCount >= usageLimits.recipes.freeLimit) {
          return false;
        }
        
        set({
          usageLimits: {
            ...usageLimits,
            recipes: {
              ...usageLimits.recipes,
              currentCount: usageLimits.recipes.currentCount + 1,
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
        
        if (status === 'premium') return true;
        
        // Reset daily count if it's a new day
        if (!isToday(usageLimits.oracleQuestions.lastResetDate)) {
          return true; // New day, so they can ask
        }
        
        return usageLimits.oracleQuestions.todayCount < usageLimits.oracleQuestions.dailyLimit;
      },

      canCreateRecipe: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        return usageLimits.recipes.currentCount < usageLimits.recipes.freeLimit;
      },

      canTrack: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return true;
        
        if (!usageLimits.tracking.startDate) return true;
        
        const daysSinceStart = getDaysDifference(usageLimits.tracking.startDate);
        return daysSinceStart <= usageLimits.tracking.freeDays;
      },

      getRemainingOracleQuestions: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return 999; // Unlimited
        
        // Reset count if it's a new day
        if (!isToday(usageLimits.oracleQuestions.lastResetDate)) {
          return usageLimits.oracleQuestions.dailyLimit;
        }
        
        return Math.max(0, usageLimits.oracleQuestions.dailyLimit - usageLimits.oracleQuestions.todayCount);
      },

      getRemainingRecipes: () => {
        const { status, usageLimits } = get();
        
        if (status === 'premium') return 999; // Unlimited
        
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
        
        if (!isToday(usageLimits.oracleQuestions.lastResetDate)) {
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