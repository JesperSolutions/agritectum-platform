import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ReportProvider } from './contexts/ReportContextSimple';
import { NotificationProvider } from './contexts/NotificationContext';
import { OfferProvider } from './contexts/OfferContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import IntlProvider from './components/IntlProvider';
import AppRouter from './Router';
import { logger } from './utils/logger';
import DevModeIndicator from './components/common/DevModeIndicator';
import OfflineIndicator from './components/common/OfflineIndicator';
import InstallPrompt from './components/common/InstallPrompt';
import { ToastContainer } from './components/common/ToastContainer';
import { useFavicon } from './hooks/useFavicon';

function App() {
  useFavicon();
  useEffect(() => {
    // PWA Installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
    };

    // PWA Update available
    const handleAppInstalled = () => {
      console.log('PWA was installed');
    };

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(error => {
          logger.error('App.serviceWorkerRegistration', error);
        });
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <ErrorBoundary>
      <IntlProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <ReportProvider>
                <OfferProvider>
                  <OfflineIndicator />
                  <InstallPrompt />
                  <AppRouter />
                  <ToastContainer />
                  <DevModeIndicator />
                </OfferProvider>
              </ReportProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </IntlProvider>
    </ErrorBoundary>
  );
}

export default App;
