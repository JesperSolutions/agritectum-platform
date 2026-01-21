import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import LoadingSpinner from '../common/LoadingSpinner';
import AgritectumLogo from '../AgritectumLogo';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

const PortalLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t } = useIntl();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || t('login.errors.signInFailed') || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 flex items-center justify-center px-4 py-12'>
      {/* Decorative background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-green-200/20 rounded-full blur-3xl'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200/20 rounded-full blur-3xl'></div>
      </div>

      <Card className='relative w-full max-w-md shadow-material-5 border-slate-200 bg-white/95 backdrop-blur-sm'>
        <CardHeader className='text-center pb-8 pt-10'>
          <div className='flex justify-center mb-6'>
            <AgritectumLogo size='xl' showText={true} />
          </div>
          <h2 className='text-2xl font-light text-slate-900 tracking-tight'>
            {t('login.customerPortal') || 'Customer Portal'}
          </h2>
          <p className='text-sm text-slate-600 mt-2'>
            {t('login.welcomeMessage') || 'Sign in to access your account'}
          </p>
        </CardHeader>

        <CardContent className='px-8 pb-10'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-material text-sm animate-in fade-in duration-200'>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium text-slate-700'>
                {t('login.email') || 'Email'}
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400' />
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className='pl-10 h-11'
                  placeholder={t('login.emailPlaceholder') || 'your@email.com'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <label htmlFor='password' className='block text-sm font-medium text-slate-700'>
                {t('login.password') || 'Password'}
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className='pl-10 pr-10 h-11'
                  placeholder={t('login.passwordPlaceholder') || '••••••••'}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-material hover:bg-slate-100'
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? t('login.hidePassword') || 'Hide password'
                      : t('login.showPassword') || 'Show password'
                  }
                >
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button type='submit' disabled={loading} className='w-full h-11 mt-8' size='lg'>
              {loading ? (
                <div className='flex items-center gap-2'>
                  <LoadingSpinner size='sm' />
                  <span>{t('login.signingIn') || 'Signing in...'}</span>
                </div>
              ) : (
                t('login.signIn') || 'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className='mt-8 text-center'>
            <p className='text-sm text-slate-600'>
              {t('login.noAccount') || "Don't have an account?"}{' '}
              <Link
                to='/portal/register'
                className='text-slate-700 hover:text-slate-900 font-medium underline-offset-4 hover:underline transition-colors'
              >
                {t('login.registerHere') || 'Register here'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalLogin;
