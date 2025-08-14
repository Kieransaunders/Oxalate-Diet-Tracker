/**
 * Comprehensive mock RevenueCat service for testing
 * Simulates all RevenueCat SDK methods with realistic behavior and delays
 */

export interface MockCustomerInfo {
  entitlements: {
    active: Record<string, MockEntitlement>;
    all: Record<string, MockEntitlement>;
  };
  allPurchaseDates: Record<string, Date>;
  allExpirationDates: Record<string, Date>;
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: Date | null;
  originalPurchaseDate: Date | null;
  requestDate: Date;
  firstSeen: Date;
  originalAppUserId: string;
  managementURL: string | null;
}

export interface MockEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  productIdentifier: string;
  originalPurchaseDate: Date;
  expirationDate: Date | null;
  store: 'APP_STORE' | 'PLAY_STORE' | 'AMAZON' | 'PROMOTIONAL';
  isSandbox: boolean;
}

export interface MockOffering {
  identifier: string;
  serverDescription: string;
  metadata: Record<string, any>;
  availablePackages: MockPackage[];
  monthly: MockPackage | null;
  annual: MockPackage | null;
  lifetime: MockPackage | null;
}

export interface MockPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM';
  product: MockProduct;
  offeringIdentifier: string;
}

export interface MockProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice: MockIntroPrice | null;
  discounts: MockDiscount[];
}

export interface MockIntroPrice {
  price: number;
  priceString: string;
  period: string;
  cycles: number;
  periodUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  periodNumberOfUnits: number;
}

export interface MockDiscount {
  identifier: string;
  price: number;
  priceString: string;
  cycles: number;
  period: string;
  periodUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  periodNumberOfUnits: number;
}

export interface MockPurchaseResult {
  customerInfo: MockCustomerInfo;
  productIdentifier: string;
  transaction: MockTransaction;
}

export interface MockTransaction {
  transactionIdentifier: string;
  productIdentifier: string;
  purchaseDate: Date;
  originalTransactionIdentifier: string;
  originalPurchaseDate: Date;
}

export interface MockOfferings {
  all: Record<string, MockOffering>;
  current: MockOffering | null;
}

export type MockErrorCode = 
  | 'PURCHASES_ERROR_USER_CANCELLED'
  | 'PURCHASES_ERROR_PAYMENT_PENDING'
  | 'PURCHASES_ERROR_STORE_PROBLEM'
  | 'PURCHASES_ERROR_PURCHASE_NOT_ALLOWED'
  | 'PURCHASES_ERROR_INVALID_SUBSCRIBER_STATE'
  | 'PURCHASES_ERROR_NETWORK_ERROR'
  | 'PURCHASES_ERROR_INVALID_CREDENTIALS'
  | 'PURCHASES_ERROR_UNEXPECTED_BACKEND_RESPONSE'
  | 'PURCHASES_ERROR_RECEIPT_ALREADY_IN_USE'
  | 'PURCHASES_ERROR_MISSING_RECEIPT_FILE'
  | 'PURCHASES_ERROR_INVALID_RECEIPT'
  | 'PURCHASES_ERROR_CONFIGURATION_ERROR';

export class MockRevenueCatError extends Error {
  code: MockErrorCode;
  domain: string;
  userInfo: Record<string, any>;

  constructor(code: MockErrorCode, message: string, userInfo: Record<string, any> = {}) {
    super(message);
    this.name = 'MockRevenueCatError';
    this.code = code;
    this.domain = 'RCPurchasesErrorDomain';
    this.userInfo = userInfo;
  }
}

/**
 * Mock RevenueCat service with configurable behavior
 */
export class MockRevenueCatService {
  private customerInfo: MockCustomerInfo;
  private offerings: MockOfferings;
  private networkDelay: number;
  private errorRate: number;
  private forceError: MockErrorCode | null;
  private listeners: Array<(customerInfo: MockCustomerInfo) => void>;

  constructor() {
    this.customerInfo = this.createFreeCustomerInfo();
    this.offerings = this.createDefaultOfferings();
    this.networkDelay = 100; // Default 100ms delay
    this.errorRate = 0; // No errors by default
    this.forceError = null;
    this.listeners = [];
  }

  /**
   * Configuration methods
   */
  setNetworkDelay(delay: number): void {
    this.networkDelay = delay;
  }

  setErrorRate(rate: number): void {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  forceNextError(errorCode: MockErrorCode): void {
    this.forceError = errorCode;
  }

  clearError(): void {
    this.forceError = null;
  }

  /**
   * Customer info factory methods
   */
  createFreeCustomerInfo(userId: string = 'test-user'): MockCustomerInfo {
    const now = new Date();
    return {
      entitlements: {
        active: {},
        all: {},
      },
      allPurchaseDates: {},
      allExpirationDates: {},
      allPurchasedProductIdentifiers: [],
      latestExpirationDate: null,
      originalPurchaseDate: null,
      requestDate: now,
      firstSeen: now,
      originalAppUserId: userId,
      managementURL: null,
    };
  }

  createPremiumCustomerInfo(
    productId: string = 'oxalate_premium_monthly',
    userId: string = 'test-user',
    willRenew: boolean = true,
    expiresInDays: number = 30
  ): MockCustomerInfo {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    
    const entitlement: MockEntitlement = {
      identifier: 'premium',
      isActive: true,
      willRenew,
      productIdentifier: productId,
      originalPurchaseDate: now,
      expirationDate,
      store: 'APP_STORE',
      isSandbox: true,
    };

    return {
      entitlements: {
        active: { premium: entitlement },
        all: { premium: entitlement },
      },
      allPurchaseDates: { [productId]: now },
      allExpirationDates: { [productId]: expirationDate },
      allPurchasedProductIdentifiers: [productId],
      latestExpirationDate: expirationDate,
      originalPurchaseDate: now,
      requestDate: now,
      firstSeen: now,
      originalAppUserId: userId,
      managementURL: 'https://apps.apple.com/account/subscriptions',
    };
  }

  createExpiredCustomerInfo(
    productId: string = 'oxalate_premium_monthly',
    userId: string = 'test-user',
    expiredDaysAgo: number = 1
  ): MockCustomerInfo {
    const now = new Date();
    const purchaseDate = new Date(now.getTime() - (expiredDaysAgo + 30) * 24 * 60 * 60 * 1000);
    const expirationDate = new Date(now.getTime() - expiredDaysAgo * 24 * 60 * 60 * 1000);
    
    const entitlement: MockEntitlement = {
      identifier: 'premium',
      isActive: false,
      willRenew: false,
      productIdentifier: productId,
      originalPurchaseDate: purchaseDate,
      expirationDate,
      store: 'APP_STORE',
      isSandbox: true,
    };

    return {
      entitlements: {
        active: {},
        all: { premium: entitlement },
      },
      allPurchaseDates: { [productId]: purchaseDate },
      allExpirationDates: { [productId]: expirationDate },
      allPurchasedProductIdentifiers: [productId],
      latestExpirationDate: expirationDate,
      originalPurchaseDate: purchaseDate,
      requestDate: now,
      firstSeen: purchaseDate,
      originalAppUserId: userId,
      managementURL: 'https://apps.apple.com/account/subscriptions',
    };
  }

  createCancelledCustomerInfo(
    productId: string = 'oxalate_premium_monthly',
    userId: string = 'test-user',
    expiresInDays: number = 15
  ): MockCustomerInfo {
    return this.createPremiumCustomerInfo(productId, userId, false, expiresInDays);
  }

  /**
   * Offerings factory methods
   */
  createDefaultOfferings(): MockOfferings {
    const monthlyPackage: MockPackage = {
      identifier: 'monthly',
      packageType: 'MONTHLY',
      offeringIdentifier: 'default',
      product: {
        identifier: 'oxalate_premium_monthly',
        description: 'Premium monthly subscription',
        title: 'Premium Monthly',
        price: 4.99,
        priceString: '$4.99',
        currencyCode: 'USD',
        introPrice: null,
        discounts: [],
      },
    };

    const annualPackage: MockPackage = {
      identifier: 'annual',
      packageType: 'ANNUAL',
      offeringIdentifier: 'default',
      product: {
        identifier: 'oxalate_premium_yearly',
        description: 'Premium yearly subscription',
        title: 'Premium Yearly',
        price: 39.99,
        priceString: '$39.99',
        currencyCode: 'USD',
        introPrice: {
          price: 19.99,
          priceString: '$19.99',
          period: 'P1M',
          cycles: 1,
          periodUnit: 'MONTH',
          periodNumberOfUnits: 1,
        },
        discounts: [],
      },
    };

    const defaultOffering: MockOffering = {
      identifier: 'default',
      serverDescription: 'Default offering',
      metadata: {},
      availablePackages: [monthlyPackage, annualPackage],
      monthly: monthlyPackage,
      annual: annualPackage,
      lifetime: null,
    };

    return {
      all: { default: defaultOffering },
      current: defaultOffering,
    };
  }

  /**
   * Error generation methods
   */
  private shouldGenerateError(): boolean {
    if (this.forceError) return true;
    return Math.random() < this.errorRate;
  }

  private generateRandomError(): MockRevenueCatError {
    const errors: MockErrorCode[] = [
      'PURCHASES_ERROR_NETWORK_ERROR',
      'PURCHASES_ERROR_STORE_PROBLEM',
      'PURCHASES_ERROR_UNEXPECTED_BACKEND_RESPONSE',
    ];
    
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return this.createError(randomError);
  }

  private createError(code: MockErrorCode): MockRevenueCatError {
    const errorMessages: Record<MockErrorCode, string> = {
      PURCHASES_ERROR_USER_CANCELLED: 'The user cancelled the purchase.',
      PURCHASES_ERROR_PAYMENT_PENDING: 'The payment is pending.',
      PURCHASES_ERROR_STORE_PROBLEM: 'There was a problem with the store.',
      PURCHASES_ERROR_PURCHASE_NOT_ALLOWED: 'Purchases are not allowed on this device.',
      PURCHASES_ERROR_INVALID_SUBSCRIBER_STATE: 'The subscriber state is invalid.',
      PURCHASES_ERROR_NETWORK_ERROR: 'Network connection failed.',
      PURCHASES_ERROR_INVALID_CREDENTIALS: 'Invalid API credentials.',
      PURCHASES_ERROR_UNEXPECTED_BACKEND_RESPONSE: 'Unexpected response from backend.',
      PURCHASES_ERROR_RECEIPT_ALREADY_IN_USE: 'Receipt is already in use.',
      PURCHASES_ERROR_MISSING_RECEIPT_FILE: 'Receipt file is missing.',
      PURCHASES_ERROR_INVALID_RECEIPT: 'Receipt is invalid.',
      PURCHASES_ERROR_CONFIGURATION_ERROR: 'Configuration error.',
    };

    return new MockRevenueCatError(code, errorMessages[code]);
  }

  /**
   * Utility methods
   */
  private async delay(): Promise<void> {
    if (this.networkDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.networkDelay));
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.customerInfo);
      } catch (error) {
        console.warn('Error in customer info listener:', error);
      }
    });
  }

  /**
   * Mock RevenueCat SDK methods
   */
  async configure(options: { apiKey: string; appUserID?: string }): Promise<void> {
    await this.delay();
    
    if (this.shouldGenerateError()) {
      const error = this.forceError ? this.createError(this.forceError) : this.generateRandomError();
      this.forceError = null;
      throw error;
    }

    // Configuration successful
    console.log('Mock RevenueCat configured with API key:', options.apiKey);
  }

  async getCustomerInfo(): Promise<MockCustomerInfo> {
    await this.delay();
    
    if (this.shouldGenerateError()) {
      const error = this.forceError ? this.createError(this.forceError) : this.generateRandomError();
      this.forceError = null;
      throw error;
    }

    return { ...this.customerInfo };
  }

  async getOfferings(): Promise<MockOfferings> {
    await this.delay();
    
    if (this.shouldGenerateError()) {
      const error = this.forceError ? this.createError(this.forceError) : this.generateRandomError();
      this.forceError = null;
      throw error;
    }

    return { ...this.offerings };
  }

  async purchaseProduct(productId: string): Promise<MockPurchaseResult> {
    await this.delay();
    
    if (this.shouldGenerateError()) {
      const error = this.forceError ? this.createError(this.forceError) : this.generateRandomError();
      this.forceError = null;
      throw error;
    }

    // Simulate successful purchase
    this.customerInfo = this.createPremiumCustomerInfo(productId);
    
    const transaction: MockTransaction = {
      transactionIdentifier: `txn_${Date.now()}`,
      productIdentifier: productId,
      purchaseDate: new Date(),
      originalTransactionIdentifier: `txn_${Date.now()}`,
      originalPurchaseDate: new Date(),
    };

    const result: MockPurchaseResult = {
      customerInfo: { ...this.customerInfo },
      productIdentifier: productId,
      transaction,
    };

    // Notify listeners
    this.notifyListeners();

    return result;
  }

  async restorePurchases(): Promise<MockCustomerInfo> {
    await this.delay();
    
    if (this.shouldGenerateError()) {
      const error = this.forceError ? this.createError(this.forceError) : this.generateRandomError();
      this.forceError = null;
      throw error;
    }

    // Return current customer info (simulating restore)
    return { ...this.customerInfo };
  }

  addCustomerInfoUpdateListener(listener: (customerInfo: MockCustomerInfo) => void): void {
    this.listeners.push(listener);
  }

  removeCustomerInfoUpdateListener(listener: (customerInfo: MockCustomerInfo) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Test utility methods
   */
  setCustomerInfo(customerInfo: MockCustomerInfo): void {
    this.customerInfo = customerInfo;
    this.notifyListeners();
  }

  setOfferings(offerings: MockOfferings): void {
    this.offerings = offerings;
  }

  simulateSubscriptionExpiry(): void {
    this.customerInfo = this.createExpiredCustomerInfo();
    this.notifyListeners();
  }

  simulateSubscriptionCancellation(): void {
    if (this.customerInfo.entitlements.active.premium) {
      this.customerInfo.entitlements.active.premium.willRenew = false;
      this.notifyListeners();
    }
  }

  simulateSubscriptionRenewal(productId?: string): void {
    const currentProductId = this.customerInfo.entitlements.active.premium?.productIdentifier || 'oxalate_premium_monthly';
    this.customerInfo = this.createPremiumCustomerInfo(productId || currentProductId);
    this.notifyListeners();
  }

  reset(): void {
    this.customerInfo = this.createFreeCustomerInfo();
    this.offerings = this.createDefaultOfferings();
    this.networkDelay = 100;
    this.errorRate = 0;
    this.forceError = null;
    this.listeners = [];
  }
}

/**
 * Global mock instance for tests
 */
export const mockRevenueCatService = new MockRevenueCatService();

/**
 * Jest mock factory for react-native-purchases
 */
export const createRevenueCatMock = () => ({
  default: {
    configure: jest.fn().mockImplementation((options: any) => mockRevenueCatService.configure(options)),
    getCustomerInfo: jest.fn().mockImplementation(() => mockRevenueCatService.getCustomerInfo()),
    getOfferings: jest.fn().mockImplementation(() => mockRevenueCatService.getOfferings()),
    purchaseProduct: jest.fn().mockImplementation((productId: string) => mockRevenueCatService.purchaseProduct(productId)),
    restorePurchases: jest.fn().mockImplementation(() => mockRevenueCatService.restorePurchases()),
    addCustomerInfoUpdateListener: jest.fn().mockImplementation((listener: any) => mockRevenueCatService.addCustomerInfoUpdateListener(listener)),
    removeCustomerInfoUpdateListener: jest.fn().mockImplementation((listener: any) => mockRevenueCatService.removeCustomerInfoUpdateListener(listener)),
    setLogLevel: jest.fn(),
    setDebugLogsEnabled: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
  },
  LOG_LEVEL: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
  },
  CustomerInfo: {},
  EntitlementInfo: {},
  PurchasesPackage: {},
});