import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { useIntl } from '../../hooks/useIntl';

interface GDPRConsent {
  analyticsconsent: boolean;
  personaldataConsent: boolean;
  termsAccepted: boolean;
  consentTimestamp: string;
}

const GDPRConsentFlow: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [showConsent, setShowConsent] = useState(false);
  const [consents, setConsents] = useState<GDPRConsent>({
    analyticsconsent: false,
    personaldataConsent: false,
    termsAccepted: false,
    consentTimestamp: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConsentStatus();
  }, [currentUser]);

  const checkConsentStatus = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const hasGDPRConsent = userData.gdprConsent && userData.gdprConsent.termsAccepted;

        if (!hasGDPRConsent) {
          setShowConsent(true);
        } else {
          setConsents(userData.gdprConsent);
        }
      } else {
        setShowConsent(true);
      }
    } catch (error) {
      logger.error('Error checking GDPR consent:', error);
      setShowConsent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (key: keyof GDPRConsent) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRequiredConsentToggle = () => {
    setConsents(prev => {
      const nextValue = !prev.termsAccepted;
      return {
        ...prev,
        termsAccepted: nextValue,
        personaldataConsent: nextValue,
      };
    });
  };

  const handleAcceptAll = () => {
    setConsents(prev => ({
      ...prev,
      analyticsconsent: true,
      personaldataConsent: true,
      termsAccepted: true,
      consentTimestamp: new Date().toISOString(),
    }));
  };

  const handleRejectAll = () => {
    setConsents(prev => ({
      ...prev,
      analyticsconsent: false,
      personaldataConsent: false,
      termsAccepted: false,
      consentTimestamp: '',
    }));
  };

  const handleSaveConsents = async () => {
    if (!currentUser || !consents.termsAccepted) {
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        gdprConsent: {
          ...consents,
          consentTimestamp: new Date().toISOString(),
        },
        lastConsentUpdate: new Date().toISOString(),
      });

      setShowConsent(false);
      logger.info('GDPR consent saved successfully');
    } catch (error) {
      logger.error('Error saving GDPR consent:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (!showConsent) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black bg-opacity-50 transition-opacity z-0' />

      {/* Modal */}
      <div className='relative z-50 flex items-center justify-center min-h-screen px-4 py-8 sm:px-6'>
        <div className='relative bg-white rounded-lg shadow-xl max-w-lg w-full'>
          {/* Header */}
          <div className='px-5 py-4 border-b border-slate-200 flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-slate-900'>{t('gdpr.title')}</h2>
              <p className='text-sm text-slate-600 mt-1'>{t('gdpr.subtitle')}</p>
            </div>
          </div>

          {/* Content */}
          <div className='px-5 py-5 space-y-4 max-h-[50vh] overflow-y-auto'>
            {/* Intro */}
            <div>
              <p className='text-slate-700 leading-relaxed'>
                {t('gdpr.intro')}
              </p>
            </div>

            {/* Consent Options */}
            <div className='space-y-3'>
              {/* Required Consent */}
              <label className='flex items-start cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition'>
                <input
                  type='checkbox'
                  checked={consents.termsAccepted}
                  onChange={handleRequiredConsentToggle}
                  className='mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                />
                <div className='ml-3 flex-1'>
                  <p className='font-medium text-slate-900'>{t('gdpr.required.title')}</p>
                  <p className='text-sm text-slate-600 mt-1'>
                    {t('gdpr.required.description')}
                  </p>
                </div>
              </label>

              {/* Analytics */}
              <label className='flex items-start cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition'>
                <input
                  type='checkbox'
                  checked={consents.analyticsconsent}
                  onChange={() => handleConsentChange('analyticsconsent')}
                  className='mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                />
                <div className='ml-3 flex-1'>
                  <p className='font-medium text-slate-900'>{t('gdpr.analytics.title')}</p>
                  <p className='text-sm text-slate-600 mt-1'>
                    {t('gdpr.analytics.description')}
                  </p>
                </div>
              </label>
            </div>

            {/* Links */}
            <div className='flex gap-3 text-sm'>
              <a
                href='/privacy-policy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                {t('gdpr.links.privacyPolicy')}
              </a>
              <span className='text-slate-400'>•</span>
              <a
                href='/terms-of-service'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                {t('gdpr.links.terms')}
              </a>
              <span className='text-slate-400'>•</span>
              <a
                href='/dpa'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                {t('gdpr.links.dpa')}
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className='px-5 py-4 border-t border-slate-200 flex gap-3 justify-end'>
            <button
              onClick={handleRejectAll}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'
            >
              {t('gdpr.actions.rejectAll')}
            </button>
            <button
              onClick={handleAcceptAll}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'
            >
              {t('gdpr.actions.acceptAll')}
            </button>
            <button
              onClick={handleSaveConsents}
              disabled={!consents.termsAccepted}
              className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {t('gdpr.actions.savePreferences')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRConsentFlow;
