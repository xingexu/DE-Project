import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Lock, Shield } from 'lucide-react';
import { ApiError as ApiErrorType } from '../utils/errorHandling';

interface ApiErrorProps {
  error: ApiErrorType;
  onRetry?: () => void;
  className?: string;
}

const ApiError: React.FC<ApiErrorProps> = ({ error, onRetry, className = '' }) => {
  // Determine which icon to display based on error status
  const getIcon = () => {
    switch (error.status) {
      case 401:
      case 403:
        return <Lock className="w-10 h-10 text-amber-500" />;
      case 404:
        return <Shield className="w-10 h-10 text-amber-500" />;
      case 500:
      case 502:
      case 503:
        return <AlertCircle className="w-10 h-10 text-red-500" />;
      default:
        if (error.message?.includes('network') || error.message?.includes('connection')) {
          return <WifiOff className="w-10 h-10 text-gray-500" />;
        }
        return <AlertCircle className="w-10 h-10 text-amber-500" />;
    }
  };

  // Get appropriate message for common errors
  const getMessage = () => {
    if (error.message) {
      return error.message;
    }
    
    switch (error.status) {
      case 401:
        return 'You need to be logged in to access this resource';
      case 403:
        return 'You don\'t have permission to access this resource';
      case 404:
        return 'The resource you\'re looking for was not found';
      case 500:
        return 'Server error. Our team has been notified.';
      default:
        return 'An error occurred while loading data';
    }
  };

  return (
    <div className={`p-6 rounded-lg border flex flex-col items-center justify-center ${className}`}>
      {getIcon()}
      <h3 className="text-lg font-medium mt-4 mb-2">{getMessage()}</h3>
      
      {error.details && error.details.length > 0 && (
        <ul className="list-disc pl-6 text-sm mb-4 text-left w-full">
          {error.details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

// Loading state fallback component
export const ApiLoading: React.FC<{ message?: string; className?: string }> = ({ 
  message = 'Loading data...', 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default ApiError;
