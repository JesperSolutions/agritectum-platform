import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'form' | 'list' | 'custom';
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3,
  className = '',
  children,
}) => {
  const getSkeletonContent = () => {
    switch (type) {
      case 'card':
        return (
          <div className='space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
            <div className='space-y-2'>
              <div className='h-3 bg-gray-200 rounded w-full animate-pulse'></div>
              <div className='h-3 bg-gray-200 rounded w-5/6 animate-pulse'></div>
              <div className='h-3 bg-gray-200 rounded w-4/6 animate-pulse'></div>
            </div>
            <div className='h-8 bg-gray-200 rounded w-1/3 animate-pulse'></div>
          </div>
        );

      case 'table':
        return (
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex space-x-4'>
                <div className='h-4 bg-gray-200 rounded w-1/4 animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded w-1/3 animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded w-1/6 animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded w-1/4 animate-pulse'></div>
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='h-3 bg-gray-200 rounded w-1/4 animate-pulse'></div>
              <div className='h-10 bg-gray-200 rounded animate-pulse'></div>
            </div>
            <div className='space-y-2'>
              <div className='h-3 bg-gray-200 rounded w-1/3 animate-pulse'></div>
              <div className='h-10 bg-gray-200 rounded animate-pulse'></div>
            </div>
            <div className='space-y-2'>
              <div className='h-3 bg-gray-200 rounded w-1/4 animate-pulse'></div>
              <div className='h-24 bg-gray-200 rounded animate-pulse'></div>
            </div>
            <div className='h-10 bg-gray-200 rounded w-1/3 animate-pulse'></div>
          </div>
        );

      case 'list':
        return (
          <div className='space-y-3'>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <div className='h-10 w-10 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/2 animate-pulse'></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'custom':
        return children || null;

      default: // text
        return (
          <div className='space-y-2'>
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`h-4 bg-gray-200 rounded animate-pulse ${
                  i === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        );
    }
  };

  return <div className={`animate-pulse ${className}`}>{getSkeletonContent()}</div>;
};

// Specialized skeleton components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <SkeletonLoader type='card' className={className} />
);

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => <SkeletonLoader type='table' className={className} />;

export const FormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <SkeletonLoader type='form' className={className} />
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className,
}) => <SkeletonLoader type='list' lines={items} className={className} />;

export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`space-y-6 ${className}`}>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default SkeletonLoader;
