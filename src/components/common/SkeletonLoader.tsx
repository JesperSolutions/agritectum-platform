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

// Enhanced stat card skeleton with realistic proportions
export const StatCardSkeleton: React.FC = () => (
  <div className='bg-white rounded-lg shadow p-6'>
    <div className='flex items-center justify-between mb-2'>
      <div className='flex items-center gap-2'>
        <div className='h-4 w-24 bg-slate-200 rounded animate-pulse' />
        <div className='h-4 w-4 bg-slate-200 rounded-full animate-pulse' />
      </div>
      <div className='h-8 w-8 bg-slate-200 rounded animate-pulse' />
    </div>
    <div className='h-9 w-16 bg-slate-200 rounded animate-pulse mb-3' />
    <div className='flex gap-2'>
      <div className='h-6 w-8 bg-slate-200 rounded animate-pulse' />
      <div className='h-6 w-8 bg-slate-200 rounded animate-pulse' />
      <div className='h-6 w-8 bg-slate-200 rounded animate-pulse' />
    </div>
  </div>
);

// Building list item skeleton
export const BuildingItemSkeleton: React.FC = () => (
  <div className='bg-white rounded-lg shadow p-6'>
    <div className='flex items-start justify-between'>
      <div className='flex-1'>
        <div className='flex items-center gap-3 mb-3'>
          <div className='h-10 w-10 bg-slate-200 rounded-lg animate-pulse' />
          <div className='space-y-2'>
            <div className='h-5 w-48 bg-slate-200 rounded animate-pulse' />
            <div className='h-4 w-64 bg-slate-200 rounded animate-pulse' />
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='h-4 w-24 bg-slate-200 rounded animate-pulse' />
          <div className='h-4 w-32 bg-slate-200 rounded animate-pulse' />
        </div>
      </div>
      <div className='h-8 w-20 bg-slate-200 rounded animate-pulse' />
    </div>
  </div>
);

// Buildings list skeleton
export const BuildingsListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className='space-y-4'>
    {Array.from({ length: count }).map((_, i) => (
      <BuildingItemSkeleton key={i} />
    ))}
  </div>
);

// Service agreement item skeleton
export const AgreementItemSkeleton: React.FC = () => (
  <div className='bg-white rounded-lg shadow p-6'>
    <div className='flex items-center justify-between mb-4'>
      <div className='flex items-center gap-3'>
        <div className='h-5 w-5 bg-slate-200 rounded animate-pulse' />
        <div className='h-5 w-40 bg-slate-200 rounded animate-pulse' />
      </div>
      <div className='h-6 w-16 bg-slate-200 rounded-full animate-pulse' />
    </div>
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='space-y-1'>
          <div className='h-3 w-16 bg-slate-200 rounded animate-pulse' />
          <div className='h-4 w-24 bg-slate-200 rounded animate-pulse' />
        </div>
      ))}
    </div>
  </div>
);

// Agreements list skeleton
export const AgreementsListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className='space-y-4'>
    {Array.from({ length: count }).map((_, i) => (
      <AgreementItemSkeleton key={i} />
    ))}
  </div>
);

// Map skeleton
export const MapSkeleton: React.FC<{ className?: string; height?: string }> = ({ 
  className = '', 
  height = '300px' 
}) => (
  <div 
    className={`bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center ${className}`}
    style={{ minHeight: height }}
  >
    <div className='h-12 w-12 bg-slate-200 rounded-full animate-pulse mb-4' />
    <div className='h-4 w-32 bg-slate-200 rounded animate-pulse mb-2' />
    <div className='h-3 w-48 bg-slate-200 rounded animate-pulse' />
  </div>
);

// Scheduled visit item skeleton
export const VisitItemSkeleton: React.FC = () => (
  <div className='flex items-center gap-4 p-4 border border-slate-200 rounded-lg'>
    <div className='h-10 w-10 bg-slate-200 rounded-lg animate-pulse' />
    <div className='flex-1 space-y-2'>
      <div className='h-4 w-3/4 bg-slate-200 rounded animate-pulse' />
      <div className='h-3 w-1/2 bg-slate-200 rounded animate-pulse' />
    </div>
    <div className='h-6 w-16 bg-slate-200 rounded-full animate-pulse' />
  </div>
);

// Visits list skeleton
export const VisitsListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className='space-y-3'>
    {Array.from({ length: count }).map((_, i) => (
      <VisitItemSkeleton key={i} />
    ))}
  </div>
);

// Portal dashboard skeleton with all widgets
export const PortalDashboardSkeleton: React.FC = () => (
  <div className='space-y-6'>
    {/* Stats row */}
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6'>
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    
    {/* Main content */}
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Buildings needing attention */}
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6 border-b border-slate-200'>
          <div className='h-6 w-48 bg-slate-200 rounded animate-pulse mb-2' />
          <div className='h-4 w-64 bg-slate-200 rounded animate-pulse' />
        </div>
        <div className='p-6 space-y-3'>
          <VisitItemSkeleton />
          <VisitItemSkeleton />
          <VisitItemSkeleton />
        </div>
      </div>
      
      {/* Upcoming visits */}
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6 border-b border-slate-200'>
          <div className='h-6 w-40 bg-slate-200 rounded animate-pulse mb-2' />
          <div className='h-4 w-56 bg-slate-200 rounded animate-pulse' />
        </div>
        <div className='p-6 space-y-3'>
          <VisitItemSkeleton />
          <VisitItemSkeleton />
          <VisitItemSkeleton />
        </div>
      </div>
    </div>
    
    {/* Map */}
    <MapSkeleton height='400px' />
  </div>
);

export default SkeletonLoader;
