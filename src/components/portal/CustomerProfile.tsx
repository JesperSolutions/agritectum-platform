import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { updateCustomerProfile } from '../../services/userAuthService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Globe, DollarSign, User } from 'lucide-react';
import { storeLocale } from '../../utils/geolocation';
import { storeCurrency, getCurrencyCode } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';

const CustomerProfile: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth();
  const { t, locale } = useIntl();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
    companyName: '',
  });
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(
    locale as SupportedLocale
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string>('DKK');

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
    toast({
      title: 'Language updated',
      description: `Language changed to ${languages.find(l => l.code === newLanguage)?.name}. Reloading...`,
    });
    const newCurrency = getCurrencyCode(newLanguage);
    setSelectedCurrency(newCurrency);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    storeCurrency(newCurrency);
    toast({
      title: 'Currency updated',
      description: `Currency changed to ${currencies.find(c => c.code === newCurrency)?.name}. Reloading...`,
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);

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

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-5xl mx-auto p-6'>
      {/* Page Header */}
      <div className='mb-6'>
        <h1 className='text-3xl font-light tracking-tight text-slate-900'>
          {t('profile.title') || 'Profile Settings'}
        </h1>
        <p className='text-slate-600 mt-2'>
          {t('profile.subtitle') || 'Manage your account information and preferences'}
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue='preferences' className='space-y-6'>
        <TabsList className='w-full justify-start bg-slate-100 rounded-material'>
          <TabsTrigger value='preferences' className='data-[state=active]:bg-white rounded-material'>
            <Globe className='h-4 w-4 mr-2' />
            Preferences
          </TabsTrigger>
          <TabsTrigger value='profile' className='data-[state=active]:bg-white rounded-material'>
            <User className='h-4 w-4 mr-2' />
            Profile Information
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value='preferences' className='space-y-6'>
          {/* Language Settings */}
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5 text-slate-600' />
                {t('profile.languageSettings') || 'Language Settings'}
              </CardTitle>
              <CardDescription>
                Choose your preferred language for the interface
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-slate-600'>Current Language:</span>
                <Badge variant='secondary'>
                  {languages.find(l => l.code === selectedLanguage)?.name}
                </Badge>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-4 rounded-material border-2 transition-all text-left ${
                      selectedLanguage === lang.code
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className='text-2xl mb-2'>{lang.flag}</p>
                    <p
                      className={`text-sm font-medium ${selectedLanguage === lang.code ? 'text-slate-900' : 'text-slate-700'}`}
                    >
                      {lang.name}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <DollarSign className='h-5 w-5 text-slate-600' />
                {t('profile.currencySettings') || 'Currency Settings'}
              </CardTitle>
              <CardDescription>
                Choose your preferred currency for pricing display
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-slate-600'>Current Currency:</span>
                <Badge variant='secondary'>
                  {currencies.find(c => c.code === selectedCurrency)?.name} ({selectedCurrency})
                </Badge>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {currencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-4 rounded-material border-2 transition-all text-left ${
                      selectedCurrency === currency.code
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className='text-2xl mb-2'>{currency.country}</p>
                    <p
                      className={`text-sm font-medium ${selectedCurrency === currency.code ? 'text-slate-900' : 'text-slate-700'}`}
                    >
                      {currency.code}
                    </p>
                    <p
                      className={`text-xs ${selectedCurrency === currency.code ? 'text-slate-600' : 'text-slate-500'}`}
                    >
                      {currency.symbol}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Information Tab */}
        <TabsContent value='profile'>
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5 text-slate-600' />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal and company information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={currentUser?.email || ''}
                    disabled
                    className='bg-slate-50 text-slate-500'
                  />
                  <p className='text-sm text-slate-500'>Email cannot be changed</p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='displayName'>
                    Full Name <span className='text-red-600'>*</span>
                  </Label>
                  <Input
                    id='displayName'
                    name='displayName'
                    type='text'
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                    placeholder='Enter your full name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder='+45 12 34 56 78'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Address</Label>
                  <Input
                    id='address'
                    name='address'
                    type='text'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='Street address, city, postal code'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='companyName'>Company Name</Label>
                  <Input
                    id='companyName'
                    name='companyName'
                    type='text'
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder='Your company name (optional)'
                  />
                </div>

                <div className='flex justify-end pt-4 border-t'>
                  <Button
                    type='submit'
                    disabled={loading}
                    className='min-w-[120px]'
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size='sm' className='mr-2' />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfile;
