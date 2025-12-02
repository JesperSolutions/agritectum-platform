import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });

    if (process.env.NODE_ENV === 'development') {
      console.error('FormErrorBoundary caught an error:', error, errorInfo);
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start'>
            <AlertCircle className='w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-red-800 mb-1'>Form Error</h3>
              <p className='text-sm text-red-700 mb-3'>
                There was an error loading this form. Please try refreshing or contact support if
                the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mb-3'>
                  <summary className='cursor-pointer text-xs font-medium text-red-600'>
                    Error Details
                  </summary>
                  <div className='mt-2 text-xs font-mono text-red-600 bg-red-100 p-2 rounded'>
                    {this.state.error.message}
                  </div>
                </details>
              )}

              <button
                onClick={this.handleRetry}
                className='inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900'
              >
                <RefreshCw className='w-4 h-4 mr-1' />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;
