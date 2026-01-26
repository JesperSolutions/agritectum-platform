import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { updateCustomerProfile } from '../../services/userAuthService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Globe, DollarSign } from 'lucide-react';
import { storeLocale } from '../../utils/geolocation';
import { storeCurrency, getCurrencyCode } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';

const CustomerProfile: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth();
  const { t, locale } = useIntl();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
    companyName: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        phone: currentUser.customerProfile?.phone || '',
        address: currentUser.customerProfile?.address || '',
        companyName: currentUser.customerProfile?.companyName || '',
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLanguageChange = (newLanguage: SupportedLocale) => {
    setSelectedLanguage(newLanguage);
    storeLocale(newLanguage, true);
    setLanguageSaved(true);
    setTimeout(() => setLanguageSaved(false), 3000);
    const newCurrency = getCurrencyCode(newLanguage);
    setSelectedCurrency(newCurrency);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    storeCurrency(newCurrency);
    setCurrencySaved(true);
    setTimeout(() => setCurrencySaved(false), 3000);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage(null);

    try {
      // Update display name in Firebase Auth
      if (firebaseUser && formData.displayName !== currentUser.displayName) {
        await firebaseUser.updateProfile({ displayName: formData.displayName });
      }

      // Update customer profile in Firestore
      await updateCustomerProfile(currentUser.uid, {
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        companyName: formData.companyName || undefined,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('profile.title') || 'Profile'}</h1>
        <p className='mt-2 text-gray-600'>
          {t('profile.subtitle') || 'Manage your account information'}
        </p>
      </div>

      {/* Language Settings */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
          <Globe className='w-5 h-5 mr-2 text-gray-600' />
          {t('profile.languageSettings') || 'Language Settings'}
        </h2>

        <div className='space-y-4'>
          <div>
            <p className='text-sm text-gray-600 mb-4'>
              {t('profile.currentLanguage') || 'Currently Selected Language'}:{' '}
              <span className='font-semibold text-gray-900'>
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
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className='text-xl mb-2'>{lang.flag}</p>
                <p
                  className={`text-sm font-medium ${selectedLanguage === lang.code ? 'text-green-900' : 'text-gray-900'}`}
                >
                  {lang.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center'>
          <DollarSign className='w-5 h-5 mr-2 text-gray-600' />
          {t('profile.currencySettings') || 'Currency Settings'}
        </h2>

        <div className='space-y-4'>
          <div>
            <p className='text-sm text-gray-600 mb-4'>
              {t('profile.currentCurrency') || 'Currently Selected Currency'}:{' '}
              <span className='font-semibold text-gray-900'>
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
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className='text-xl mb-2'>{currency.country}</p>
                <p
                  className={`text-sm font-medium ${selectedCurrency === currency.code ? 'text-green-900' : 'text-gray-900'}`}
                >
                  {currency.code}
                </p>
                <p
                  className={`text-xs ${selectedCurrency === currency.code ? 'text-green-700' : 'text-gray-600'}`}
                >
                  {currency.symbol}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className='bg-white rounded-lg shadow p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={currentUser?.email || ''}
              disabled
              className='w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500'
            />
            <p className='mt-1 text-sm text-gray-500'>Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor='displayName' className='block text-sm font-medium text-gray-700 mb-2'>
              Full Name *
            </label>
            <input
              id='displayName'
              name='displayName'
              type='text'
              value={formData.displayName}
              onChange={handleChange}
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
              Phone
            </label>
            <input
              id='phone'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-2'>
              Address
            </label>
            <input
              id='address'
              name='address'
              type='text'
              value={formData.address}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-2'>
              Company Name
            </label>
            <input
              id='companyName'
              name='companyName'
              type='text'
              value={formData.companyName}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading ? <LoadingSpinner size='sm' className='mr-2' /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile;
