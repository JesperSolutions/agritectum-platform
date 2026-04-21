import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // NOTE: Service worker registration moved to App.tsx to avoid duplicates
    // This hook only handles SW messaging and PWA features

    // Listen for messages from service worker.
    // Fix #6: capture the handler so it can be removed on unmount; previously
    // every mount installed a new anonymous listener that was never cleaned up.
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_OFFLINE_REPORTS') {
        window.dispatchEvent(new CustomEvent('syncOfflineReports'));
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  return {
    isOnline,
    installPrompt,
    installApp,
  };
};
