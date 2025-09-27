import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }
  
  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-50 border border-red-100 text-center min-h-[200px] w-full">
          <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
            <details className="mt-4 text-left w-full">
              <summary className="text-sm text-red-600 cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-[300px]">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;