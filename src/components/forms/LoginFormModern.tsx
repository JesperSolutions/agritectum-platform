import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Building2, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginFormModern: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useIntl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      // Login error handled by error display
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError(t('login.error.invalidCredentials'));
          break;
        case 'auth/invalid-email':
          setError(t('login.error.invalidEmail'));
          break;
        case 'auth/user-disabled':
          setError(t('login.error.userDisabled'));
          break;
        case 'auth/too-many-requests':
          setError(t('login.error.tooManyRequests'));
          break;
        case 'auth/network-request-failed':
          setError(t('login.error.networkError'));
          break;
        default:
          setError(t('login.error.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='w-full max-w-md'>
        <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='space-y-2 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='p-3 bg-blue-600 rounded-full'>
                <Building2 className='h-8 w-8 text-white' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-gray-900'>{t('login.title')}</CardTitle>
            <CardDescription className='text-gray-600'>{t('login.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
                  {t('login.email')}
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder={t('login.placeholder.email') || 'kund@example.com'}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='pl-10 h-11'
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
                  {t('login.password')}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='pl-10 pr-10 h-11'
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type='submit'
                className='w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>{t('login.signingIn')}</span>
                  </div>
                ) : (
                  t('login.signIn')
                )}
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-gray-600'>{t('login.helpText')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginFormModern;
