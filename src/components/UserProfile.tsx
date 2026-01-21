import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIntl } from '../hooks/useIntl';
import {
  User,
  Mail,
  Lock,
  Shield,
  Calendar,
  Building,
  Save,
  Eye,
  EyeOff,
  Globe,
  DollarSign,
} from 'lucide-react';
import { updateUserPassword, reauthenticateUser } from '../services/authService';
import { storeLocale } from '../utils/geolocation';
import { storeCurrency, getCurrencyCode } from '../utils/currency';
import type { SupportedLocale } from '../utils/geolocation';
import ChangelogModal from './ChangelogModal';

const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, locale } = useIntl();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(
    locale as SupportedLocale
  );
  const [languageSaved, setLanguageSaved] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('DKK');
  const [currencySaved, setCurrencySaved] = useState(false);

  // Initialize currency on component mount
  useEffect(() => {
    const currentCurrency = getCurrencyCode(locale as SupportedLocale);
    setSelectedCurrency(currentCurrency);
  }, [locale]);

  const currencies = [
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: '🇩🇰' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: '🇸🇪' },
    { code: 'EUR', name: 'Euro', symbol: '€', country: '🇪🇺' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: '🇳🇴' },
    { code: 'USD', name: 'US Dollar', symbol: '$', country: '🇺🇸' },
  ];

  const languages: { code: SupportedLocale; name: string; flag: string }[] = [
    { code: 'sv-SE', name: 'Svenska (Sweden)', flag: '🇸🇪' },
    { code: 'da-DK', name: 'Dansk (Denmark)', flag: '🇩🇰' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Deutsch (Germany)', flag: '🇩🇪' },
    { code: 'no-NO', name: 'Norsk (Norway)', flag: '🇳🇴' },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (newPassword.length < 8) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      setError(t('profile.passwordRequirements'));
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before password change (Firebase security requirement)
      await reauthenticateUser(currentUser?.email || '', currentPassword);

      // Update password
      await updateUserPassword(newPassword);

      setSuccess(t('profile.passwordChangeSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setError(t('profile.currentPasswordIncorrect'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('profile.passwordTooWeak'));
      } else {
        setError(t('profile.passwordChangeError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: SupportedLocale) => {
    setSelectedLanguage(newLanguage);
    storeLocale(newLanguage, true); // true = manual selection
    setLanguageSaved(true);
    setTimeout(() => setLanguageSaved(false), 3000);
    // Update currency based on new language if not manually set
    const newCurrency = getCurrencyCode(newLanguage);
    setSelectedCurrency(newCurrency);
    // Optionally reload the page to apply language changes
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    storeCurrency(newCurrency);
    setCurrencySaved(true);
    setTimeout(() => setCurrencySaved(false), 3000);
    // Reload to apply currency changes
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Language Settings */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center'>
          <Globe className='w-6 h-6 mr-2 text-slate-600' />
          {t('profile.languageSettings') || 'Language Settings'}
        </h2>

        <div className='space-y-4'>
          <div>
            <p className='text-sm text-slate-600 mb-4'>
              {t('profile.currentLanguage') || 'Currently Selected Language'}:{' '}
              <span className='font-semibold text-slate-900'>
                {languages.find(l => l.code === selectedLanguage)?.name}
              </span>
            </p>
          </div>

          {languageSaved && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm'>
              ✓ {t('profile.languageSaved') || 'Language preference saved'}
            </div>
          )}

          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedLanguage === lang.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className='text-xl mb-2'>{lang.flag}</p>
                <p
                  className={`text-sm font-medium ${selectedLanguage === lang.code ? 'text-blue-900' : 'text-slate-900'}`}
                >
                  {lang.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center'>
          <DollarSign className='w-6 h-6 mr-2 text-slate-600' />
          {t('profile.currencySettings') || 'Currency Settings'}
        </h2>

        <div className='space-y-4'>
          <div>
            <p className='text-sm text-slate-600 mb-4'>
              {t('profile.currentCurrency') || 'Currently Selected Currency'}:{' '}
              <span className='font-semibold text-slate-900'>
                {currencies.find(c => c.code === selectedCurrency)?.name} ({selectedCurrency})
              </span>
            </p>
          </div>

          {currencySaved && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm'>
              ✓ {t('profile.currencySaved') || 'Currency preference saved'}
            </div>
          )}

          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {currencies.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedCurrency === currency.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className='text-xl mb-2'>{currency.country}</p>
                <p
                  className={`text-sm font-medium ${selectedCurrency === currency.code ? 'text-blue-900' : 'text-slate-900'}`}
                >
                  {currency.code}
                </p>
                <p
                  className={`text-xs ${selectedCurrency === currency.code ? 'text-blue-700' : 'text-slate-600'}`}
                >
                  {currency.symbol}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center'>
          <User className='w-6 h-6 mr-2 text-slate-600' />
          {t('profile.accountInformation')}
        </h2>

        <div className='space-y-4'>
          <div className='flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200'>
            <Mail className='w-5 h-5 mr-3 text-slate-600' />
            <div>
              <p className='text-sm text-slate-600'>{t('profile.email')}</p>
              <p className='font-semibold text-slate-900'>{currentUser?.email}</p>
            </div>
          </div>

          <div className='flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200'>
            <User className='w-5 h-5 mr-3 text-slate-600' />
            <div>
              <p className='text-sm text-slate-600'>{t('profile.displayName')}</p>
              <p className='font-semibold text-slate-900'>
                {currentUser?.displayName || t('profile.notSet')}
              </p>
            </div>
          </div>

          <div className='flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200'>
            <Shield className='w-5 h-5 mr-3 text-slate-600' />
            <div>
              <p className='text-sm text-slate-600'>{t('profile.role')}</p>
              <p className='font-semibold text-slate-900 capitalize'>{currentUser?.role}</p>
            </div>
          </div>

          <div className='flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200'>
            <Building className='w-5 h-5 mr-3 text-slate-600' />
            <div>
              <p className='text-sm text-slate-600'>{t('profile.branch')}</p>
              <p className='font-semibold text-slate-900'>
                {currentUser?.branchId || t('profile.notAssigned')}
              </p>
            </div>
          </div>

          <div className='flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200'>
            <Calendar className='w-5 h-5 mr-3 text-slate-600' />
            <div>
              <p className='text-sm text-slate-600'>{t('profile.lastLogin')}</p>
              <p className='font-semibold text-slate-900'>
                {currentUser?.lastLogin
                  ? new Date(currentUser.lastLogin).toLocaleString('sv-SE')
                  : t('profile.never')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center'>
          <Lock className='w-6 h-6 mr-2 text-slate-600' />
          {t('profile.changePassword')}
        </h2>

        <form onSubmit={handlePasswordChange} className='space-y-4'>
          {/* Current Password */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('profile.currentPassword')}
            </label>
            <div className='relative'>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 pr-10 shadow-sm'
              />
              <button
                type='button'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
              >
                {showCurrentPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('profile.newPassword')}
            </label>
            <div className='relative'>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 pr-10 shadow-sm'
              />
              <button
                type='button'
                onClick={() => setShowNewPassword(!showNewPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
              >
                {showNewPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('profile.confirmNewPassword')}
            </label>
            <div className='relative'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 pr-10 shadow-sm'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
              >
                {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className='bg-slate-50 border border-slate-200 rounded-lg p-4'>
            <p className='text-sm text-slate-900 font-semibold mb-2'>
              {t('profile.passwordRequirementsTitle')}
            </p>
            <ul className='text-sm text-slate-700 space-y-1'>
              <li>• {t('profile.passwordRequirement1')}</li>
              <li>• {t('profile.passwordRequirement2')}</li>
              <li>• {t('profile.passwordRequirement3')}</li>
            </ul>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          )}

          {success && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <p className='text-sm text-green-800'>{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors shadow-sm'
          >
            {loading ? (
              <>
                <span className='animate-spin'>⏳</span>
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <>
                <Save className='w-5 h-5' />
                <span>{t('profile.savePassword')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Version Information */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <div className='text-center text-sm text-slate-500'>
          <button
            onClick={() => setIsChangelogOpen(true)}
            className='text-slate-500 hover:text-slate-700 hover:underline transition-colors cursor-pointer'
            aria-label='View changelog'
          >
            Version {(import.meta.env.VITE_APP_VERSION as string) || '1.0.0'}
          </button>
        </div>
      </div>

      {/* Changelog Modal */}
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
};

export default UserProfile;
