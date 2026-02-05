import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { X, CheckCircle } from 'lucide-react';
import { logger } from '../../utils/logger';

interface GDPRConsent {
  analyticsconsent: boolean;
  personaldataConsent: boolean;
  termsAccepted: boolean;
  consentTimestamp: string;
}

const GDPRConsentFlow: React.FC = () => {
  const { currentUser } = useAuth();
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

  const handleAcceptAll = () => {
    setConsents(prev => ({
      ...prev,
      analyticsconsent: true,
      personaldataConsent: true,
      termsAccepted: true,
      consentTimestamp: new Date().toISOString(),
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
      <div className='relative z-50 flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
        <div className='relative bg-white rounded-lg shadow-xl max-w-2xl w-full'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-slate-200 flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-semibold text-slate-900'>Privacy & Data Protection</h2>
              <p className='text-sm text-slate-600 mt-1'>GDPR Compliance</p>
            </div>
          </div>

          {/* Content */}
          <div className='px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto'>
            {/* Intro */}
            <div>
              <p className='text-slate-700 leading-relaxed'>
                We value your privacy and comply fully with GDPR and Nordic data protection regulations. 
                Please review and accept our data processing terms below.
              </p>
            </div>

            {/* Consent Options */}
            <div className='space-y-4'>
              {/* Terms of Service */}
              <label className='flex items-start cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition'>
                <input
                  type='checkbox'
                  checked={consents.termsAccepted}
                  onChange={() => handleConsentChange('termsAccepted')}
                  className='mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                />
                <div className='ml-3 flex-1'>
                  <p className='font-medium text-slate-900'>I accept the Terms of Service</p>
                  <p className='text-sm text-slate-600 mt-1'>
                    Required to use the platform. This covers our service policies and your account usage.
                  </p>
                </div>
              </label>

              {/* Personal Data Processing */}
              <label className='flex items-start cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition'>
                <input
                  type='checkbox'
                  checked={consents.personaldataConsent}
                  onChange={() => handleConsentChange('personaldataConsent')}
                  className='mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                />
                <div className='ml-3 flex-1'>
                  <p className='font-medium text-slate-900'>I consent to personal data processing</p>
                  <p className='text-sm text-slate-600 mt-1'>
                    We process your data to provide personalized features, send important communications, 
                    and comply with legal obligations. Your data is encrypted and never shared with third parties.
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
                  <p className='font-medium text-slate-900'>I consent to analytics</p>
                  <p className='text-sm text-slate-600 mt-1'>
                    Optional. Helps us improve the platform by understanding how you use it. 
                    No sensitive data is collected.
                  </p>
                </div>
              </label>
            </div>

            {/* Data Rights */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h3 className='font-semibold text-slate-900 mb-3'>Your Rights (GDPR)</h3>
              <ul className='space-y-2 text-sm text-slate-700'>
                <li className='flex items-start'>
                  <CheckCircle className='h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                  <span><strong>Right to Access:</strong> Download all your data anytime</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                  <span><strong>Right to Rectification:</strong> Correct inaccurate information</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                  <span><strong>Right to Erasure:</strong> Delete your account and data</span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-4 w-4 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                  <span><strong>Right to Portability:</strong> Export data in standard format</span>
                </li>
              </ul>
            </div>

            {/* Links */}
            <div className='flex gap-3 text-sm'>
              <a
                href='/privacy-policy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                Full Privacy Policy
              </a>
              <span className='text-slate-400'>•</span>
              <a
                href='/terms-of-service'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                Terms of Service
              </a>
              <span className='text-slate-400'>•</span>
              <a
                href='/dpa'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:text-blue-700 underline'
              >
                Data Processing Agreement
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className='px-6 py-4 border-t border-slate-200 flex gap-3 justify-end'>
            <button
              onClick={handleAcceptAll}
              className='px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'
            >
              Accept All
            </button>
            <button
              onClick={handleSaveConsents}
              disabled={!consents.termsAccepted}
              className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRConsentFlow;
