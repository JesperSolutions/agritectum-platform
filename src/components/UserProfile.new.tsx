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
  Globe,
  DollarSign,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { updateUserPassword, reauthenticateUser } from '../services/authService';
import { storeLocale } from '../utils/geolocation';
import { storeCurrency, getCurrencyCode } from '../utils/currency';
import type { SupportedLocale } from '../utils/geolocation';
import ChangelogModal from './ChangelogModal';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useToast } from '../hooks/use-toast';

const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, locale } = useIntl();
  const { toast } = useToast();
  
  // Password dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // General state
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(
    locale as SupportedLocale
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string>('DKK');

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
    setPasswordError('');

    // Validate passwords
    if (newPassword.length < 8) {
      setPasswordError(t('profile.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordsDoNotMatch'));
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      setPasswordError(t('profile.passwordRequirements'));
      return;
    }

    setPasswordLoading(true);

    try {
      await reauthenticateUser(currentUser?.email || '', currentPassword);
      await updateUserPassword(newPassword);

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });

      // Close dialog and reset form
      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError(t('profile.currentPasswordIncorrect'));
      } else if (err.code === 'auth/weak-password') {
        setPasswordError(t('profile.passwordTooWeak'));
      } else {
        setPasswordError(t('profile.passwordChangeError'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: SupportedLocale) => {
    setSelectedLanguage(newLanguage);
    storeLocale(newLanguage, true);
    
    // Update currency based on language
    const newCurrency = getCurrencyCode(newLanguage);
    setSelectedCurrency(newCurrency);
    storeCurrency(newCurrency);
    
    toast({
      title: 'Language updated',
      description: `Interface language changed to ${languages.find(l => l.code === newLanguage)?.name}. Reloading...`,
    });
    
    // Reload to apply language changes throughout the app
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    storeCurrency(newCurrency);
    
    toast({
      title: 'Currency updated',
      description: `Display currency changed to ${newCurrency}. Reloading...`,
    });
    
    // Reload to apply currency changes
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className='max-w-5xl mx-auto p-6 space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-3xl font-light tracking-tight text-slate-900'>
          {t('profile.title') || 'Profile Settings'}
        </h1>
        <p className='text-slate-600 mt-2'>
          {t('profile.subtitle') || 'Manage your account settings and preferences'}
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue='general' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='general'>{t('profile.general') || 'General'}</TabsTrigger>
          <TabsTrigger value='preferences'>{t('profile.preferences') || 'Preferences'}</TabsTrigger>
          <TabsTrigger value='security'>{t('profile.security') || 'Security'}</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value='general' className='space-y-6'>
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <User className='w-5 h-5 mr-2 text-slate-600' />
                {t('profile.accountInformation') || 'Account Information'}
              </CardTitle>
              <CardDescription>
                {t('profile.accountDescription') || 'Your personal information and account details'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-slate-700 flex items-center gap-2'>
                    <Mail className='w-4 h-4' />
                    {t('profile.email') || 'Email'}
                  </Label>
                  <Input
                    value={currentUser?.email || ''}
                    disabled
                    className='bg-slate-50 border-slate-200'
                  />
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-700 flex items-center gap-2'>
                    <User className='w-4 h-4' />
                    {t('profile.displayName') || 'Display Name'}
                  </Label>
                  <Input
                    value={currentUser?.displayName || t('profile.notSet')}
                    disabled
                    className='bg-slate-50 border-slate-200'
                  />
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-700 flex items-center gap-2'>
                    <Shield className='w-4 h-4' />
                    {t('profile.role') || 'Role'}
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      value={currentUser?.role || ''}
                      disabled
                      className='bg-slate-50 border-slate-200 capitalize'
                    />
                    <Badge variant='secondary' className='capitalize'>
                      {currentUser?.role}
                    </Badge>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-700 flex items-center gap-2'>
                    <Building className='w-4 h-4' />
                    {t('profile.branch') || 'Branch'}
                  </Label>
                  <Input
                    value={currentUser?.branchId || t('profile.notAssigned')}
                    disabled
                    className='bg-slate-50 border-slate-200'
                  />
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-700 flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    {t('profile.lastLogin') || 'Last Login'}
                  </Label>
                  <Input
                    value={
                      currentUser?.lastLogin
                        ? new Date(currentUser.lastLogin).toLocaleString('sv-SE')
                        : t('profile.never')
                    }
                    disabled
                    className='bg-slate-50 border-slate-200'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value='preferences' className='space-y-6'>
          {/* Language Settings */}
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Globe className='w-5 h-5 mr-2 text-slate-600' />
                {t('profile.languageSettings') || 'Language Settings'}
              </CardTitle>
              <CardDescription>
                {t('profile.languageDescription') || 'Choose your preferred interface language'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-4 rounded-material border-2 transition-all text-left relative ${
                      selectedLanguage === lang.code
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {selectedLanguage === lang.code && (
                      <Check className='absolute top-2 right-2 w-4 h-4 text-slate-900' />
                    )}
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
              <CardTitle className='flex items-center'>
                <DollarSign className='w-5 h-5 mr-2 text-slate-600' />
                {t('profile.currencySettings') || 'Currency Settings'}
              </CardTitle>
              <CardDescription>
                {t('profile.currencyDescription') || 'Choose your preferred display currency'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
                {currencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-4 rounded-material border-2 transition-all text-left relative ${
                      selectedCurrency === currency.code
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {selectedCurrency === currency.code && (
                      <Check className='absolute top-2 right-2 w-4 h-4 text-slate-900' />
                    )}
                    <p className='text-2xl mb-2'>{currency.country}</p>
                    <p
                      className={`text-sm font-medium ${selectedCurrency === currency.code ? 'text-slate-900' : 'text-slate-700'}`}
                    >
                      {currency.code}
                    </p>
                    <p className='text-xs text-slate-500'>{currency.symbol}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-6'>
          <Card className='rounded-material shadow-material-2'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Lock className='w-5 h-5 mr-2 text-slate-600' />
                {t('profile.securitySettings') || 'Security Settings'}
              </CardTitle>
              <CardDescription>
                {t('profile.securityDescription') || 'Manage your password and security preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border border-slate-200 rounded-material bg-slate-50'>
                  <div>
                    <p className='font-medium text-slate-900'>
                      {t('profile.password') || 'Password'}
                    </p>
                    <p className='text-sm text-slate-600'>
                      {t('profile.passwordDescription') || 'Last changed recently'}
                    </p>
                  </div>
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant='outline'>{t('profile.changePassword') || 'Change Password'}</Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[500px]'>
                      <DialogHeader>
                        <DialogTitle>{t('profile.changePassword') || 'Change Password'}</DialogTitle>
                        <DialogDescription>
                          {t('profile.changePasswordDescription') || 'Enter your current password and choose a new one'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordChange} className='space-y-4'>
                        {/* Current Password */}
                        <div className='space-y-2'>
                          <Label htmlFor='current-password'>
                            {t('profile.currentPassword') || 'Current Password'}
                          </Label>
                          <div className='relative'>
                            <Input
                              id='current-password'
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              required
                              className='pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
                            >
                              {showCurrentPassword ? (
                                <EyeOff className='w-4 h-4' />
                              ) : (
                                <Eye className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className='space-y-2'>
                          <Label htmlFor='new-password'>
                            {t('profile.newPassword') || 'New Password'}
                          </Label>
                          <div className='relative'>
                            <Input
                              id='new-password'
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              required
                              className='pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
                            >
                              {showNewPassword ? (
                                <EyeOff className='w-4 h-4' />
                              ) : (
                                <Eye className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className='space-y-2'>
                          <Label htmlFor='confirm-password'>
                            {t('profile.confirmNewPassword') || 'Confirm New Password'}
                          </Label>
                          <div className='relative'>
                            <Input
                              id='confirm-password'
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              required
                              className='pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700'
                            >
                              {showConfirmPassword ? (
                                <EyeOff className='w-4 h-4' />
                              ) : (
                                <Eye className='w-4 h-4' />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Password Requirements */}
                        <div className='bg-slate-50 border border-slate-200 rounded-material p-4'>
                          <p className='text-sm font-medium text-slate-900 mb-2'>
                            {t('profile.passwordRequirementsTitle') || 'Password Requirements'}
                          </p>
                          <ul className='text-sm text-slate-600 space-y-1'>
                            <li className='flex items-center gap-2'>
                              <Check className='w-3 h-3' />
                              {t('profile.passwordRequirement1') || 'At least 8 characters'}
                            </li>
                            <li className='flex items-center gap-2'>
                              <Check className='w-3 h-3' />
                              {t('profile.passwordRequirement2') || 'Include uppercase and lowercase'}
                            </li>
                            <li className='flex items-center gap-2'>
                              <Check className='w-3 h-3' />
                              {t('profile.passwordRequirement3') || 'Include at least one number'}
                            </li>
                          </ul>
                        </div>

                        {/* Error Message */}
                        {passwordError && (
                          <div className='bg-red-50 border border-red-200 rounded-material p-3'>
                            <p className='text-sm text-red-800'>{passwordError}</p>
                          </div>
                        )}

                        <DialogFooter>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setIsPasswordDialogOpen(false)}
                          >
                            {t('common.cancel') || 'Cancel'}
                          </Button>
                          <Button type='submit' disabled={passwordLoading}>
                            {passwordLoading
                              ? t('common.saving') || 'Saving...'
                              : t('profile.savePassword') || 'Update Password'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Version Footer */}
      <Card className='rounded-material shadow-material-1'>
        <CardContent className='py-4'>
          <div className='text-center text-sm text-slate-500'>
            <button
              onClick={() => setIsChangelogOpen(true)}
              className='hover:text-slate-700 hover:underline transition-colors'
            >
              Version {(import.meta.env.VITE_APP_VERSION as string) || '1.0.0'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Modal */}
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
};

export default UserProfile;
