import React, { useState, useEffect } from 'react';
import { useIntl } from '../../hooks/useIntl';
import { WifiOff } from 'lucide-react';

/**
 * OfflineIndicator component displays a notification banner when the user is offline
 * and hides it when online. Provides visual feedback about network connectivity.
 */
const OfflineIndicator: React.FC = () => {
  const { t } = useIntl();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justWentOffline, setJustWentOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustWentOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustWentOffline(true);
      // Clear the "just went offline" flag after 3 seconds
      setTimeout(() => setJustWentOffline(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything when online
  if (isOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        justWentOffline ? 'animate-slide-down' : ''
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-amber-500 text-white px-4 py-2 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            {t('common.offlineMode') || 'You\'re offline. Changes will sync when connection is restored.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
