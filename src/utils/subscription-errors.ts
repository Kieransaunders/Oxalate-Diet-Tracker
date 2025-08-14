import { toast } from './toast';

// RevenueCat error codes and their user-friendly messages
export const REVENUECAT_ERRORS = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  OFFLINE_CONNECTION_ERROR: 'OFFLINE_CONNECTION_ERROR',
  
  // Purchase errors
  PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
  STORE_PROBLEM_ERROR: 'STORE_PROBLEM_ERROR',
  PURCHASE_NOT_ALLOWED_ERROR: 'PURCHASE_NOT_ALLOWED_ERROR',
  PURCHASE_INVALID_ERROR: 'PURCHASE_INVALID_ERROR',
  PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR',
  PRODUCT_ALREADY_PURCHASED_ERROR: 'PRODUCT_ALREADY_PURCHASED_ERROR',
  
  // Receipt/Restore errors
  RECEIPT_ALREADY_IN_USE_ERROR: 'RECEIPT_ALREADY_IN_USE_ERROR',
  INVALID_RECEIPT_ERROR: 'INVALID_RECEIPT_ERROR',
  MISSING_RECEIPT_FILE_ERROR: 'MISSING_RECEIPT_FILE_ERROR',
  
  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNEXPECTED_BACKEND_RESPONSE_ERROR: 'UNEXPECTED_BACKEND_RESPONSE_ERROR',
  INVALID_CREDENTIALS_ERROR: 'INVALID_CREDENTIALS_ERROR',
  
  // User errors
  INVALID_APP_USER_ID_ERROR: 'INVALID_APP_USER_ID_ERROR',
  OPERATION_ALREADY_IN_PROGRESS_ERROR: 'OPERATION_ALREADY_IN_PROGRESS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export interface SubscriptionError {
  code: string;
  message: string;
  originalError?: any;
  isRetryable: boolean;
  userMessage: string;
  actionLabel?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export function mapRevenueCatError(error: any): SubscriptionError {
  const errorCode = error?.code || error?.domain || 'UNKNOWN_ERROR';
  const errorMessage = error?.message || error?.localizedDescription || 'An unknown error occurred';

  switch (errorCode) {
    case REVENUECAT_ERRORS.NETWORK_ERROR:
    case REVENUECAT_ERRORS.OFFLINE_CONNECTION_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        actionLabel: 'Retry',
      };

    case REVENUECAT_ERRORS.PURCHASE_CANCELLED_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'Purchase was cancelled. You can try again whenever you\'re ready.',
      };

    case REVENUECAT_ERRORS.STORE_PROBLEM_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'The App Store is having issues. Please try again in a few moments.',
        actionLabel: 'Retry',
      };

    case REVENUECAT_ERRORS.PURCHASE_NOT_ALLOWED_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'Purchases are not allowed on this device. Please check your device settings.',
      };

    case REVENUECAT_ERRORS.PURCHASE_INVALID_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'This purchase is not valid. Please contact support if the problem persists.',
      };

    case REVENUECAT_ERRORS.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'This product is temporarily unavailable. Please try again later.',
        actionLabel: 'Retry',
      };

    case REVENUECAT_ERRORS.PRODUCT_ALREADY_PURCHASED_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'You already own this subscription. Try restoring your purchases instead.',
        actionLabel: 'Restore Purchases',
      };

    case REVENUECAT_ERRORS.RECEIPT_ALREADY_IN_USE_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'This receipt is already in use by another account. Please contact support.',
      };

    case REVENUECAT_ERRORS.INVALID_RECEIPT_ERROR:
    case REVENUECAT_ERRORS.MISSING_RECEIPT_FILE_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'Receipt validation failed. Please try again or contact support if the issue persists.',
        actionLabel: 'Retry',
      };

    case REVENUECAT_ERRORS.CONFIGURATION_ERROR:
    case REVENUECAT_ERRORS.INVALID_CREDENTIALS_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'App configuration issue. Please update the app or contact support.',
      };

    case REVENUECAT_ERRORS.OPERATION_ALREADY_IN_PROGRESS_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: false,
        userMessage: 'Another purchase is in progress. Please wait for it to complete.',
      };

    case REVENUECAT_ERRORS.UNEXPECTED_BACKEND_RESPONSE_ERROR:
      return {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'Server issue occurred. Please try again in a moment.',
        actionLabel: 'Retry',
      };

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        originalError: error,
        isRetryable: true,
        userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
        actionLabel: 'Retry',
      };
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const mappedError = mapRevenueCatError(error);
      
      // Don't retry if the error is not retryable
      if (!mappedError.isRetryable) {
        throw mappedError;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw mappedError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      console.log(`Subscription operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, mappedError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw mapRevenueCatError(lastError);
}

export function handleSubscriptionError(error: SubscriptionError, onRetry?: () => void) {
  if (error.isRetryable && onRetry && error.actionLabel) {
    toast.error(
      'Purchase Failed',
      error.userMessage,
      {
        label: error.actionLabel,
        onPress: onRetry,
      }
    );
  } else {
    toast.error('Purchase Failed', error.userMessage);
  }
  
  // Log the technical error for debugging
  console.error('Subscription Error:', {
    code: error.code,
    message: error.message,
    originalError: error.originalError,
  });
}