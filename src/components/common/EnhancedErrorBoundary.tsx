import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnhancedErrorBoundary caught an error:', error, errorInfo);

    // Log to external service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6'>
            <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4'>
              <AlertTriangle className='w-6 h-6 text-red-600' />
            </div>

            <div className='text-center'>
              <h1 className='text-xl font-semibold text-gray-900 mb-2'>Something went wrong</h1>
              <p className='text-gray-600 mb-6'>
                {this.props.context
                  ? `An error occurred in ${this.props.context}. Please try again.`
                  : 'An unexpected error occurred. Please try again.'}
              </p>

              <div className='space-y-3'>
                <button
                  onClick={this.handleRetry}
                  className='w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className='w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  <Home className='w-4 h-4 mr-2' />
                  Go to Dashboard
                </button>
              </div>

              {this.props.showDetails && this.state.error && (
                <details className='mt-6 text-left'>
                  <summary className='cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center'>
                    <Bug className='w-4 h-4 mr-1' />
                    Technical Details
                  </summary>
                  <div className='mt-2 p-3 bg-gray-100 rounded-md text-xs font-mono text-gray-600 overflow-auto max-h-32'>
                    <div className='mb-2'>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className='whitespace-pre-wrap mt-1'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
