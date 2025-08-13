import { Platform } from 'react-native';

// Dynamic import to handle cases where native module isn't available
let Purchases: any = null;
let LOG_LEVEL: any = null;
let CustomerInfo: any = null;

try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const PurchasesModule = require('react-native-purchases');
    Purchases = PurchasesModule.default;
    LOG_LEVEL = PurchasesModule.LOG_LEVEL;
    CustomerInfo = PurchasesModule.CustomerInfo;
  }
} catch (error) {
  console.warn('react-native-purchases not available in config:', error);
}

// RevenueCat API Keys - these will be set up in RevenueCat dashboard
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'YOUR_IOS_API_KEY';
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'YOUR_ANDROID_API_KEY';

// Product IDs - these will be configured in App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  MONTHLY_PREMIUM: 'oxalate_premium_monthly',
  YEARLY_PREMIUM: 'oxalate_premium_yearly',
} as const;

// Entitlement identifier - this will be configured in RevenueCat
export const ENTITLEMENT_ID = 'premium';

// RevenueCat configuration
export const configureRevenueCat = async () => {
  try {
    if (!Purchases || !LOG_LEVEL) {
      console.warn('Purchases module not available, skipping RevenueCat configuration');
      return false;
    }

    // Enable debug logging in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with platform-specific API keys
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    
    if (!apiKey || apiKey.includes('YOUR_')) {
      console.warn('RevenueCat API key not configured. Running in demo mode.');
      return false;
    }

    await Purchases.configure({ apiKey });
    
    console.log('RevenueCat configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure RevenueCat:', error);
    return false;
  }
};

// Type definition that works even when native module isn't available
type CustomerInfo = any;

// Helper function to check if user has premium access
export const isPremiumUser = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) return false;
  
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
};

// Helper function to get subscription status
export const getSubscriptionStatus = (customerInfo: CustomerInfo | null) => {
  if (!customerInfo) {
    return {
      isPremium: false,
      isActive: false,
      willRenew: false,
      productIdentifier: null,
      originalPurchaseDate: null,
      expirationDate: null,
    };
  }

  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  
  if (!entitlement) {
    return {
      isPremium: false,
      isActive: false,
      willRenew: false,
      productIdentifier: null,
      originalPurchaseDate: null,
      expirationDate: null,
    };
  }

  return {
    isPremium: true,
    isActive: entitlement.isActive,
    willRenew: entitlement.willRenew,
    productIdentifier: entitlement.productIdentifier,
    originalPurchaseDate: entitlement.originalPurchaseDate,
    expirationDate: entitlement.expirationDate,
  };
};

// Helper function to format subscription details for display
export const formatSubscriptionDetails = (customerInfo: CustomerInfo | null) => {
  const status = getSubscriptionStatus(customerInfo);
  
  if (!status.isPremium) {
    return {
      statusText: 'Free Plan',
      nextBillingText: 'Upgrade to Premium',
      isActive: false,
    };
  }

  const expirationDate = status.expirationDate;
  const isMonthly = status.productIdentifier?.includes('monthly');
  
  if (!status.willRenew) {
    return {
      statusText: 'Premium (Expires Soon)',
      nextBillingText: expirationDate 
        ? `Expires ${new Date(expirationDate).toLocaleDateString()}`
        : 'Subscription ending',
      isActive: true,
    };
  }

  return {
    statusText: isMonthly ? 'Premium Monthly' : 'Premium Yearly',
    nextBillingText: expirationDate 
      ? `Renews ${new Date(expirationDate).toLocaleDateString()}`
      : 'Active subscription',
    isActive: true,
  };
};

// Error handling for purchase flows
export const handlePurchaseError = (error: any) => {
  console.error('Purchase error:', error);
  
  // Handle common RevenueCat errors
  if (error?.code === 'PURCHASES_ERROR_PAYMENT_PENDING') {
    return 'Payment is pending. Please check back later.';
  }
  
  if (error?.code === 'PURCHASES_ERROR_USER_CANCELLED') {
    return 'Purchase was cancelled.';
  }
  
  if (error?.code === 'PURCHASES_ERROR_STORE_PROBLEM') {
    return 'There was a problem with the app store. Please try again.';
  }
  
  if (error?.code === 'PURCHASES_ERROR_PURCHASE_NOT_ALLOWED') {
    return 'Purchases are not allowed on this device.';
  }
  
  if (error?.code === 'PURCHASES_ERROR_INVALID_SUBSCRIBER_STATE') {
    return 'Invalid subscriber state. Please contact support.';
  }
  
  return 'Purchase failed. Please try again or contact support.';
};

// Demo mode configuration for development
export const isDemoMode = () => {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
  return !apiKey || apiKey.includes('YOUR_');
};

// Mock customer info for demo mode
export const createMockCustomerInfo = (isPremium: boolean = false): Partial<CustomerInfo> => ({
  entitlements: {
    active: isPremium ? {
      [ENTITLEMENT_ID]: {
        identifier: ENTITLEMENT_ID,
        isActive: true,
        willRenew: true,
        productIdentifier: PRODUCT_IDS.MONTHLY_PREMIUM,
        originalPurchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      } as any
    } : {},
    all: {}
  },
  allPurchaseDates: {},
  allExpirationDates: {},
  allPurchasedProductIdentifiers: isPremium ? [PRODUCT_IDS.MONTHLY_PREMIUM] : [],
  latestExpirationDate: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
  originalPurchaseDate: isPremium ? new Date() : null,
  requestDate: new Date(),
  firstSeen: new Date(),
  originalAppUserId: 'demo-user',
  managementURL: null,
} as any);