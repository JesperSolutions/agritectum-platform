import React, { useState, useEffect } from 'react';
import { useIntl } from '../../hooks/useIntl';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

/**
 * InstallPrompt component shows a custom install prompt for PWA
 * Allows users to install the Taklaget app on their device
 * Supports iOS (manual instructions) and Android/Desktop (beforeinstallprompt)
 */
const InstallPrompt: React.FC = () => {
  const { t } = useIntl();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    // iOS: show custom instructions (no beforeinstallprompt support)
    if (isIOS()) {
      const iosDismissed = sessionStorage.getItem('installPromptDismissed');
      if (!iosDismissed) {
        setShowIOSInstructions(true);
        setShowInstall(true);
      }
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
      className='fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg border border-gray-200 p-4 z-50 max-w-sm animate-slide-up'
      role='dialog'
      aria-labelledby='install-prompt-title'
      aria-describedby='install-prompt-description'
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <Download className='w-5 h-5 text-[#7DA8CC]' />
          <h3 id='install-prompt-title' className='font-semibold text-gray-900 text-sm'>
            {t('common.install.title') || 'Install Taklaget App'}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className='text-gray-400 hover:text-gray-600 transition-colors'
          aria-label={t('common.buttons.close')}
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      <p id='install-prompt-description' className='text-sm text-gray-600 mb-4'>
        {showIOSInstructions
          ? (t('common.install.iosDescription') || 'Add this app to your home screen for the best experience')
          : (t('common.install.description') || 'Install for offline access and faster performance')}
      </p>

      {showIOSInstructions ? (
        <div className='space-y-3'>
          <div className='bg-slate-50 rounded-lg p-3 space-y-2 text-sm text-gray-700'>
            <div className='flex items-center gap-2'>
              <span className='flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-bold'>1</span>
              <span className='flex items-center gap-1'>
                {t('common.install.iosStep1') || 'Tap the share button'}
                <Share className='w-4 h-4 text-[#7DA8CC] inline' />
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-bold'>2</span>
              <span>{t('common.install.iosStep2') || 'Scroll down and tap "Add to Home Screen"'}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-bold'>3</span>
              <span>{t('common.install.iosStep3') || 'Tap "Add" to confirm'}</span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className='w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors'
          >
            {t('common.install.gotIt') || 'Got it!'}
          </button>
        </div>
      ) : (
        <div className='flex gap-2'>
          <button
            onClick={handleInstall}
            className='flex-1 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
          >
            {t('common.install.button') || 'Install Now'}
          </button>
          <button
            onClick={handleDismiss}
            className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors'
          >
            {t('common.buttons.cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
