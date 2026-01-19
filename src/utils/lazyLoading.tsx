import React, { lazy, ComponentType } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { logger } from './logger';

// Higher-order component for lazy loading with loading fallback
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  const WrappedComponent = (props: P) => {
    const FallbackComponent =
      fallback ||
      (() => (
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner size='lg' text='Loading...' />
        </div>
      ));

    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Lazy load components with custom loading states
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: React.ComponentType;
    loadingText?: string;
    className?: string;
  } = {}
) => {
  const LazyComponent = lazy(importFn);

  const { fallback, loadingText = 'Loading...', className = '' } = options;

  const FallbackComponent =
    fallback ||
    (() => (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size='lg' text={loadingText} />
      </div>
    ));

  return (props: P) => (
    <React.Suspense fallback={<FallbackComponent />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Preload components for better UX
export const preloadComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) => {
  return () => {
    const [Component, setComponent] = React.useState<ComponentType<P> | null>(null);
    const [isPreloaded, setIsPreloaded] = React.useState(false);

    React.useEffect(() => {
      importFn().then(module => {
        setComponent(() => module.default);
        setIsPreloaded(true);
      });
    }, []);

    if (!isPreloaded || !Component) {
      return (
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner size='lg' text='Preloading...' />
        </div>
      );
    }

    return <Component {...({} as P)} />;
  };
};

// Route-based code splitting
export const createLazyRoute = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  routeName: string
) => {
  const LazyComponent = lazy(importFn);

  const RouteComponent = (props: P) => (
    <React.Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <LoadingSpinner size='lg' />
            <p className='mt-4 text-gray-600'>Loading {routeName}...</p>
          </div>
        </div>
      }
    >
      <LazyComponent {...props} />
    </React.Suspense>
  );

  RouteComponent.displayName = `LazyRoute(${routeName})`;
  return RouteComponent;
};

// Dynamic import with retry logic
export const importWithRetry = <T,>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const attemptImport = async () => {
      try {
        const module = await importFn();
        resolve(module);
      } catch (error) {
        retries++;

        if (retries < maxRetries) {
          setTimeout(attemptImport, delay * retries);
        } else {
          reject(error);
        }
      }
    };

    attemptImport();
  });
};

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would typically be used with webpack-bundle-analyzer
    logger.log('Bundle analysis available in development mode');
    logger.log('Run: npm run build && npx webpack-bundle-analyzer dist/assets/*.js');
  }
};
