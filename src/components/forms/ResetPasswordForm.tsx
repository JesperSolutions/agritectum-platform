import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { verifyResetCode, confirmPasswordReset } from '../../services/authService';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import AgritectumLogo from '../AgritectumLogo';

const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string>('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useIntl();

  useEffect(() => {
    const verifyCode = async () => {
      const code = searchParams.get('oobCode');
      const mode = searchParams.get('mode');

      if (!code || mode !== 'resetPassword') {
        setError(t('resetPassword.error.invalidLink'));
        setVerifying(false);
        return;
      }

      try {
        const email = await verifyResetCode(code);
        setEmail(email);
        setVerifying(false);
      } catch (error: any) {
        console.error('Verify code error:', error);
        setError(t('resetPassword.error.invalidOrExpiredLink'));
        setVerifying(false);
      }
    };

    verifyCode();
  }, [searchParams, t]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return t('resetPassword.error.passwordTooShort');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(pwd)) {
      return t('resetPassword.error.passwordRequirements');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.error.passwordsDoNotMatch'));
      return;
    }

    const code = searchParams.get('oobCode');
    if (!code) {
      setError(t('resetPassword.error.invalidLink'));
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(code, password);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);

      switch (error.code) {
        case 'auth/expired-action-code':
          setError(t('resetPassword.error.expiredLink'));
          break;
        case 'auth/invalid-action-code':
          setError(t('resetPassword.error.invalidLink'));
          break;
        case 'auth/weak-password':
          setError(t('resetPassword.error.passwordTooWeak'));
          break;
        default:
          setError(t('resetPassword.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-material'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            <div className='flex justify-center mb-8'>
              <AgritectumLogo size='xl' className='justify-center' />
            </div>
            <LoadingSpinner size='lg' />
            <p className='mt-4 text-gray-600'>{t('resetPassword.verifying')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-material'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-8'>
            <AgritectumLogo size='xl' className='justify-center' />
          </div>
          <h2 className='mt-4 text-4xl font-light text-gray-900 tracking-tight'>
            {t('resetPassword.title')}
          </h2>
          <p className='mt-3 text-base text-gray-600 font-light'>
            {email ? t('resetPassword.subtitle', { email }) : t('resetPassword.subtitleGeneric')}
          </p>
        </div>

        <form
          className='mt-8 space-y-6 bg-white p-8 rounded-material shadow-material-4'
          onSubmit={handleSubmit}
        >
          {error && (
            <div className='rounded-material bg-red-50 p-4 border-l-4 border-red-500'>
              <div className='flex items-center'>
                <AlertCircle className='w-5 h-5 text-red-500 flex-shrink-0' />
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className='rounded-material bg-green-50 p-4 border-l-4 border-green-500'>
              <div className='flex items-center'>
                <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0' />
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-green-800'>
                    {t('resetPassword.success.title')}
                  </h3>
                  <p className='mt-1 text-sm text-green-700'>
                    {t('resetPassword.success.message')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div className='space-y-6'>
                <div>
                  <label
                    htmlFor='password'
                    className='block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'
                  >
                    {t('resetPassword.newPassword')}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className='block w-full pl-12 pr-12 py-3 border-b-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all duration-material font-light'
                      placeholder={t('resetPassword.placeholder.password')}
                      disabled={loading}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-4 flex items-center'
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400' />
                      )}
                    </button>
                  </div>
                  <p className='mt-2 text-xs text-gray-500'>{t('resetPassword.passwordHint')}</p>
                </div>

                <div>
                  <label
                    htmlFor='confirmPassword'
                    className='block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'
                  >
                    {t('resetPassword.confirmPassword')}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className='block w-full pl-12 pr-12 py-3 border-b-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all duration-material font-light'
                      placeholder={t('resetPassword.placeholder.confirmPassword')}
                      disabled={loading}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute inset-y-0 right-0 pr-4 flex items-center'
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400' />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className='pt-4 space-y-3'>
                <button
                  type='submit'
                  disabled={loading}
                  className='group relative w-full flex justify-center py-3 px-6 text-base font-medium rounded-material text-white bg-blue-600 hover:bg-blue-700 shadow-material-2 hover:shadow-material-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-material uppercase tracking-wide'
                >
                  {loading ? <LoadingSpinner size='sm' /> : t('resetPassword.resetPassword')}
                </button>

                <Link
                  to='/login'
                  className='flex items-center justify-center w-full py-3 px-6 text-base font-medium rounded-material text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-material'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </form>

        {/* Powered by Agritectum */}
        <div className='mt-8 text-center'>
          <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
            <span>Powered by</span>
            <a
              href='https://agritectum.com'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center hover:opacity-80 transition-opacity'
            >
              <img
                src='/agritectum-logo.png'
                alt='Agritectum'
                className='h-5 w-auto'
                onError={e => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.fallback-text') as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'inline';
                    }
                  }
                }}
              />
              <span
                className='fallback-text ml-1.5 font-medium text-gray-700'
                style={{ display: 'none' }}
              >
                Agritectum
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
