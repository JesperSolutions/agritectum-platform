import React, { useState, useEffect } from 'react';
import { useIntl } from '../../hooks/useIntl';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallPrompt component shows a custom install prompt for PWA
 * Allows users to install the Taklaget app on their device
 */
const InstallPrompt: React.FC = () => {
  const { t } = useIntl();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstall(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowInstall(false);
      }
    } catch (error) {
      console.error('Error during install prompt:', error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showInstall || sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg border border-gray-200 p-4 z-50 max-w-sm animate-slide-up"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          <h3 id="install-prompt-title" className="font-semibold text-gray-900 text-sm">
            {t('common.install.title') || 'Install Taklaget App'}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('common.buttons.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p id="install-prompt-description" className="text-sm text-gray-600 mb-4">
        {t('common.install.description') || 'Install for offline access and faster performance'}
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('common.install.button') || 'Install Now'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {t('common.buttons.cancel')}
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
