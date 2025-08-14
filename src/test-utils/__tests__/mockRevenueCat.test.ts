/**
 * Tests for the mock RevenueCat service
 */

import { mockRevenueCatService, MockRevenueCatError } from '../mockRevenueCat';

describe('Mock RevenueCat Service', () => {
  beforeEach(() => {
    mockRevenueCatService.reset();
  });

  describe('Customer Info Factory', () => {
    it('should create free customer info', () => {
      const customerInfo = mockRevenueCatService.createFreeCustomerInfo();
      
      expect(customerInfo.entitlements.active).toEqual({});
      expect(customerInfo.allPurchasedProductIdentifiers).toEqual([]);
      expect(customerInfo.latestExpirationDate).toBeNull();
    });

    it('should create premium customer info', () => {
      const customerInfo = mockRevenueCatService.createPremiumCustomerInfo();
      
      expect(customerInfo.entitlements.active.premium).toBeDefined();
      expect(customerInfo.entitlements.active.premium.isActive).toBe(true);
      expect(customerInfo.entitlements.active.premium.willRenew).toBe(true);
      expect(customerInfo.allPurchasedProductIdentifiers).toContain('oxalate_premium_monthly');
    });

    it('should create expired customer info', () => {
      const customerInfo = mockRevenueCatService.createExpiredCustomerInfo();
      
      expect(customerInfo.entitlements.active).toEqual({});
      expect(customerInfo.entitlements.all.premium).toBeDefined();
      expect(customerInfo.entitlements.all.premium.isActive).toBe(false);
    });

    it('should create cancelled customer info', () => {
      const customerInfo = mockRevenueCatService.createCancelledCustomerInfo();
      
      expect(customerInfo.entitlements.active.premium).toBeDefined();
      expect(customerInfo.entitlements.active.premium.isActive).toBe(true);
      expect(customerInfo.entitlements.active.premium.willRenew).toBe(false);
    });
  });

  describe('SDK Methods', () => {
    it('should configure successfully', async () => {
      await expect(mockRevenueCatService.configure({ apiKey: 'test-key' })).resolves.toBeUndefined();
    });

    it('should get customer info', async () => {
      const customerInfo = await mockRevenueCatService.getCustomerInfo();
      expect(customerInfo).toBeDefined();
      expect(customerInfo.entitlements).toBeDefined();
    });

    it('should get offerings', async () => {
      const offerings = await mockRevenueCatService.getOfferings();
      expect(offerings).toBeDefined();
      expect(offerings.all.default).toBeDefined();
      expect(offerings.current).toBeDefined();
    });

    it('should purchase product successfully', async () => {
      const result = await mockRevenueCatService.purchaseProduct('oxalate_premium_monthly');
      
      expect(result.customerInfo.entitlements.active.premium).toBeDefined();
      expect(result.productIdentifier).toBe('oxalate_premium_monthly');
      expect(result.transaction).toBeDefined();
    });

    it('should restore purchases', async () => {
      const customerInfo = await mockRevenueCatService.restorePurchases();
      expect(customerInfo).toBeDefined();
    });
  });

  describe('Error Simulation', () => {
    it('should generate errors when error rate is set', async () => {
      mockRevenueCatService.setErrorRate(1); // 100% error rate
      
      await expect(mockRevenueCatService.getCustomerInfo()).rejects.toThrow();
    });

    it('should force specific errors', async () => {
      mockRevenueCatService.forceNextError('PURCHASES_ERROR_USER_CANCELLED');
      
      await expect(mockRevenueCatService.purchaseProduct('test')).rejects.toThrow(MockRevenueCatError);
    });

    it('should clear forced errors', async () => {
      mockRevenueCatService.forceNextError('PURCHASES_ERROR_USER_CANCELLED');
      mockRevenueCatService.clearError();
      
      await expect(mockRevenueCatService.purchaseProduct('test')).resolves.toBeDefined();
    });
  });

  describe('Network Simulation', () => {
    it('should simulate network delays', async () => {
      mockRevenueCatService.setNetworkDelay(100);
      
      const start = Date.now();
      await mockRevenueCatService.getCustomerInfo();
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(100);
    });

    it('should work without delays when set to 0', async () => {
      mockRevenueCatService.setNetworkDelay(0);
      
      const start = Date.now();
      await mockRevenueCatService.getCustomerInfo();
      const end = Date.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Test Utilities', () => {
    it('should allow setting custom customer info', () => {
      const customInfo = mockRevenueCatService.createPremiumCustomerInfo();
      mockRevenueCatService.setCustomerInfo(customInfo);
      
      // Customer info should be updated
      expect(mockRevenueCatService.getCustomerInfo()).resolves.toEqual(customInfo);
    });

    it('should simulate subscription expiry', () => {
      mockRevenueCatService.setCustomerInfo(mockRevenueCatService.createPremiumCustomerInfo());
      mockRevenueCatService.simulateSubscriptionExpiry();
      
      expect(mockRevenueCatService.getCustomerInfo()).resolves.toMatchObject({
        entitlements: { active: {} }
      });
    });

    it('should simulate subscription cancellation', () => {
      mockRevenueCatService.setCustomerInfo(mockRevenueCatService.createPremiumCustomerInfo());
      mockRevenueCatService.simulateSubscriptionCancellation();
      
      expect(mockRevenueCatService.getCustomerInfo()).resolves.toMatchObject({
        entitlements: { 
          active: { 
            premium: { willRenew: false } 
          } 
        }
      });
    });

    it('should reset to initial state', () => {
      mockRevenueCatService.setCustomerInfo(mockRevenueCatService.createPremiumCustomerInfo());
      mockRevenueCatService.setErrorRate(0.5);
      mockRevenueCatService.setNetworkDelay(500);
      
      mockRevenueCatService.reset();
      
      expect(mockRevenueCatService.getCustomerInfo()).resolves.toMatchObject({
        entitlements: { active: {} }
      });
    });
  });
});