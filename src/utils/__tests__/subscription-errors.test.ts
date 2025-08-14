import { mapRevenueCatError, withRetry, REVENUECAT_ERRORS } from '../subscription-errors';

describe('subscription-errors', () => {
  describe('mapRevenueCatError', () => {
    it('should map network errors correctly', () => {
      const error = {
        code: REVENUECAT_ERRORS.NETWORK_ERROR,
        message: 'Network connection failed'
      };
      
      const mappedError = mapRevenueCatError(error);
      
      expect(mappedError.code).toBe(REVENUECAT_ERRORS.NETWORK_ERROR);
      expect(mappedError.isRetryable).toBe(true);
      expect(mappedError.userMessage).toContain('Network connection issue');
      expect(mappedError.actionLabel).toBe('Retry');
    });

    it('should map purchase cancelled errors correctly', () => {
      const error = {
        code: REVENUECAT_ERRORS.PURCHASE_CANCELLED_ERROR,
        message: 'Purchase was cancelled by user'
      };
      
      const mappedError = mapRevenueCatError(error);
      
      expect(mappedError.code).toBe(REVENUECAT_ERRORS.PURCHASE_CANCELLED_ERROR);
      expect(mappedError.isRetryable).toBe(false);
      expect(mappedError.userMessage).toContain('cancelled');
      expect(mappedError.actionLabel).toBeUndefined();
    });

    it('should handle unknown errors', () => {
      const error = {
        code: 'SOME_UNKNOWN_ERROR',
        message: 'Unknown error occurred'
      };
      
      const mappedError = mapRevenueCatError(error);
      
      expect(mappedError.code).toBe('UNKNOWN_ERROR');
      expect(mappedError.isRetryable).toBe(true);
      expect(mappedError.userMessage).toContain('Something went wrong');
    });

    it('should handle errors without code', () => {
      const error = {
        message: 'Error without code'
      };
      
      const mappedError = mapRevenueCatError(error);
      
      expect(mappedError.code).toBe('UNKNOWN_ERROR');
      expect(mappedError.isRetryable).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('should retry retryable errors', async () => {
      let attempts = 0;
      const mockOperation = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          const error = {
            code: REVENUECAT_ERRORS.NETWORK_ERROR,
            message: 'Network error'
          };
          throw error;
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(mockOperation, { 
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100 
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      let attempts = 0;
      const mockOperation = jest.fn(() => {
        attempts++;
        const error = {
          code: REVENUECAT_ERRORS.PURCHASE_CANCELLED_ERROR,
          message: 'Purchase cancelled'
        };
        throw error;
      });

      await expect(withRetry(mockOperation)).rejects.toEqual(
        expect.objectContaining({
          code: REVENUECAT_ERRORS.PURCHASE_CANCELLED_ERROR,
          isRetryable: false
        })
      );

      expect(attempts).toBe(1); // Only initial attempt, no retries
    });

    it('should fail after max retries', async () => {
      let attempts = 0;
      const mockOperation = jest.fn(() => {
        attempts++;
        const error = {
          code: REVENUECAT_ERRORS.NETWORK_ERROR,
          message: 'Network error'
        };
        throw error;
      });

      await expect(withRetry(mockOperation, { 
        maxRetries: 2,
        baseDelay: 10 
      })).rejects.toEqual(
        expect.objectContaining({
          code: REVENUECAT_ERRORS.NETWORK_ERROR,
          isRetryable: true
        })
      );

      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });
  });
});