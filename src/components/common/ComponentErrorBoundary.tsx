import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '../../utils/logger';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary for catching errors in dashboard components
 * Prevents one broken component from crashing the entire dashboard
 */
export class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    logger.error(`[${this.props.componentName || 'Component'}] Error caught by boundary:`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    // Update state to show error UI
    this.setState({ errorInfo });

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4'>
            <AlertTriangle className='w-6 h-6 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-red-900'>
                {this.props.componentName || 'Component'} Failed to Load
              </h3>
              <p className='text-sm text-red-700 mt-1'>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className='mt-4 text-xs text-red-600'>
                  <summary className='cursor-pointer font-medium'>Debug Info</summary>
                  <pre className='mt-2 p-2 bg-red-100 rounded overflow-auto whitespace-pre-wrap break-words'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
