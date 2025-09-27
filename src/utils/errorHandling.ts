import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// Error types
export type ApiError = {
  status?: number;
  message: string;
  details?: string[];
  code?: string;
};

/**
 * Parse error from Axios response
 */
export const parseApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    // Handle Axios errors
    if ((error as AxiosError).isAxiosError) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      
      // Handle different error response structures
      if (axiosError.response?.data) {
        const data = axiosError.response.data as any;
        
        // Standard API error format
        if (data.message) {
          return {
            status,
            message: data.message,
            details: data.errors || data.details,
            code: data.code
          };
        }
        
        // Alternative error format
        if (data.error) {
          return {
            status,
            message: typeof data.error === 'string' ? data.error : 'Unknown error',
            code: data.code
          };
        }
      }
      
      // Network errors
      if (axiosError.message === 'Network Error') {
        return {
          message: 'Unable to connect to the server. Please check your internet connection.'
        };
      }
      
      // Handle common status codes
      if (status) {
        switch (status) {
          case 400:
            return { status, message: 'Invalid request. Please check your input.' };
          case 401:
            return { status, message: 'Authentication required. Please login again.' };
          case 403:
            return { status, message: 'You do not have permission to perform this action.' };
          case 404:
            return { status, message: 'Resource not found.' };
          case 409:
            return { status, message: 'Conflict with existing resource.' };
          case 422:
            return { status, message: 'Validation error. Please check your input.' };
          case 429:
            return { status, message: 'Too many requests. Please try again later.' };
          case 500:
            return { status, message: 'Server error. Please try again later.' };
          default:
            return { 
              status,
              message: axiosError.message || 'An error occurred. Please try again.' 
            };
        }
      }
    }
    
    // Handle regular errors
    return {
      message: error.message || 'An error occurred'
    };
  }
  
  // Handle unknown errors
  return {
    message: 'An unknown error occurred'
  };
};

/**
 * Show toast notification for API error
 */
export const showErrorToast = (error: unknown, fallbackMessage = 'An error occurred'): ApiError => {
  const apiError = parseApiError(error);
  toast.error(apiError.message || fallbackMessage);
  return apiError;
};

/**
 * Handle API error with different behavior based on status code
 */
export const handleApiError = (
  error: unknown, 
  callbacks?: {
    onUnauthorized?: () => void;
    onForbidden?: () => void;
    onNotFound?: () => void;
    onValidationError?: (details?: string[]) => void;
    onServerError?: () => void;
    onGenericError?: (apiError: ApiError) => void;
  }
): ApiError => {
  const apiError = parseApiError(error);
  
  // Show error toast
  toast.error(apiError.message);
  
  // Run callback based on status code
  if (callbacks) {
    switch (apiError.status) {
      case 401:
        callbacks.onUnauthorized?.();
        break;
      case 403:
        callbacks.onForbidden?.();
        break;
      case 404:
        callbacks.onNotFound?.();
        break;
      case 422:
        callbacks.onValidationError?.(apiError.details);
        break;
      case 500:
        callbacks.onServerError?.();
        break;
      default:
        callbacks.onGenericError?.(apiError);
        break;
    }
  }
  
  return apiError;
};

/**
 * Create a safe wrapper for API calls with error handling
 */
export const safeApiCall = async<T>(
  apiCall: () => Promise<T>,
  errorConfig?: {
    fallbackMessage?: string;
    showToast?: boolean;
    callbacks?: {
      onUnauthorized?: () => void;
      onForbidden?: () => void;
      onNotFound?: () => void;
      onValidationError?: (details?: string[]) => void;
      onServerError?: () => void;
      onGenericError?: (apiError: ApiError) => void;
    }
  }
): Promise<{ data: T | null; error: ApiError | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const apiError = parseApiError(error);
    
    if (errorConfig?.showToast !== false) {
      toast.error(apiError.message || errorConfig?.fallbackMessage || 'An error occurred');
    }
    
    // Run callback based on status code
    if (errorConfig?.callbacks) {
      switch (apiError.status) {
        case 401:
          errorConfig.callbacks.onUnauthorized?.();
          break;
        case 403:
          errorConfig.callbacks.onForbidden?.();
          break;
        case 404:
          errorConfig.callbacks.onNotFound?.();
          break;
        case 422:
          errorConfig.callbacks.onValidationError?.(apiError.details);
          break;
        case 500:
          errorConfig.callbacks.onServerError?.();
          break;
        default:
          errorConfig.callbacks.onGenericError?.(apiError);
          break;
      }
    }
    
    return { data: null, error: apiError };
  }
};
