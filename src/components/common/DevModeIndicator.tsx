/**
 * Development Mode Indicator
 *
 * Visual indicator showing when the app is running in development mode
 * with Firebase Emulators. Helps prevent confusion between dev and prod environments.
 */

import React from 'react';

const DevModeIndicator: React.FC = () => {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <div className='bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600'>
        <div className='flex items-center space-x-2'>
          <div className='animate-pulse'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div>
            <p className='text-xs font-bold'>DEVELOPMENT MODE</p>
            <p className='text-[10px] opacity-75'>Using Local Emulators</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevModeIndicator;
