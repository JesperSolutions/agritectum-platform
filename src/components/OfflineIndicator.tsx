import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { OFFLINE_SYNC_FAILED_EVENT, type OfflineSyncFailedDetail } from '../hooks/useOfflineStatus';
import { useIntl } from '../hooks/useIntl';

const OfflineIndicator: React.FC = () => {
  const { t } = useIntl();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  // Fix #2: surface sync failures to the user. When useOfflineStatus emits
  // OFFLINE_SYNC_FAILED_EVENT we show a dismissible banner.
  const [syncFailure, setSyncFailure] = useState<OfflineSyncFailedDetail | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    const handleSyncFailed = (event: Event) => {
      const detail = (event as CustomEvent<OfflineSyncFailedDetail>).detail;
      if (detail) setSyncFailure(detail);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(OFFLINE_SYNC_FAILED_EVENT, handleSyncFailed);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(OFFLINE_SYNC_FAILED_EVENT, handleSyncFailed);
    };
  }, []);

  if (isOnline && !syncFailure) {
    return null;
  }

  return (
    <div className='fixed top-4 right-4 z-50 flex flex-col gap-2'>
      {!isOnline && (
        <div
          role='status'
          aria-live='polite'
          className='bg-[#DA5062] text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2'
        >
          <WifiOff className='w-4 h-4' />
          <span className='text-sm font-medium'>
            {showOfflineMessage ? t('common.offlineWorkingLocally') : t('common.offline')}
          </span>
        </div>
      )}
      {syncFailure && (
        <div
          role='alert'
          aria-live='assertive'
          className='bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-start space-x-2 max-w-sm'
          data-testid='offline-sync-failed'
        >
          <AlertTriangle className='w-4 h-4 mt-0.5 flex-shrink-0' />
          <div className='flex-1'>
            <p className='text-sm font-medium'>
              {syncFailure.failedCount > 0
                ? t('common.syncFailedWithCount', { count: syncFailure.failedCount })
                : t('common.syncFailed')}
            </p>
            <p className='text-xs opacity-90 mt-0.5'>
              {syncFailure.lastError || t('common.syncErrorFallback')}
            </p>
          </div>
          <button
            type='button'
            onClick={() => setSyncFailure(null)}
            className='text-white/80 hover:text-white text-sm ml-2'
            aria-label={t('common.dismissSyncFailure')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
