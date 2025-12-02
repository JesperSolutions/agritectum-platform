import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Props for the ErrorBoundary component
 */
interface Props {
  /** The component tree to wrap with error boundary */
  children: ReactNode;
  /** Custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
  /** Callback function called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component
 */
interface State {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error?: Error;
  /** Additional error information */
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the component tree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={handleError}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  /**
   * Creates an instance of ErrorBoundary
   * @param props - The component props
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Updates state so the next render will show the fallback UI
   * @param error - The error that was thrown
   * @returns The new state
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Called when an error is caught by the error boundary
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Handles retry button click - resets error state
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  /**
   * Handles go home button click - navigates to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='flex justify-center mb-4'>
              <AlertTriangle className='w-16 h-16 text-red-500' />
            </div>

            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Oops! Something went wrong</h1>

            <p className='text-gray-600 mb-6'>
              We're sorry, but something unexpected happened. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='cursor-pointer text-sm font-medium text-gray-700 mb-2'>
                  Error Details (Development)
                </summary>
                <div className='bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32'>
                  <div className='mb-2'>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className='whitespace-pre-wrap mt-1'>{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className='flex gap-3 justify-center'>
              <button
                onClick={this.handleRetry}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <Home className='w-4 h-4 mr-2' />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
