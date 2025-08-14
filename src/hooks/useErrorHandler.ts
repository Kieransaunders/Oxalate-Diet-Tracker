import { useState, useCallback } from 'react';
import { toast } from '../utils/toast';

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  actions?: Array<{
    label: string;
    onPress: () => void;
  }>;
}

export interface UseErrorHandlerReturn {
  error: ErrorState | null;
  showError: (error: string | ErrorState, type?: 'error' | 'warning' | 'info') => void;
  showToast: (error: string | ErrorState, type?: 'error' | 'warning' | 'info') => void;
  clearError: () => void;
  hasError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((errorInput: string | ErrorState, type: 'error' | 'warning' | 'info' = 'error') => {
    if (typeof errorInput === 'string') {
      setError({
        message: errorInput,
        type,
      });
    } else {
      setError(errorInput);
    }
  }, []);

  const showToast = useCallback((errorInput: string | ErrorState, type: 'error' | 'warning' | 'info' = 'error') => {
    const errorState = typeof errorInput === 'string' 
      ? { message: errorInput, type }
      : errorInput;

    const action = errorState.actions?.[0];
    
    switch (errorState.type) {
      case 'warning':
        toast.warning('Warning', errorState.message, action);
        break;
      case 'info':
        toast.info('Information', errorState.message, action);
        break;
      default:
        toast.error('Error', errorState.message, action);
        break;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showError,
    showToast,
    clearError,
    hasError: error !== null,
  };
};