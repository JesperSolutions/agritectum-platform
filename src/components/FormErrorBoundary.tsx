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
        <div className='bg-[#DA5062]/10 border border-[#DA5062]/30 rounded-lg p-4'>
          <div className='flex items-start'>
            <AlertCircle className='w-5 h-5 text-[#DA5062] mt-0.5 mr-3 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-[#872a38] mb-1'>Form Error</h3>
              <p className='text-sm text-[#c23d4f] mb-3'>
                There was an error loading this form. Please try refreshing or contact support if
                the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mb-3'>
                  <summary className='cursor-pointer text-xs font-medium text-[#DA5062]'>
                    Error Details
                  </summary>
                  <div className='mt-2 text-xs font-mono text-[#DA5062] bg-[#DA5062]/15 p-2 rounded'>
                    {this.state.error.message}
                  </div>
                </details>
              )}

              <button
                onClick={this.handleRetry}
                className='inline-flex items-center text-sm font-medium text-[#872a38] hover:text-[#6e2530]'
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
