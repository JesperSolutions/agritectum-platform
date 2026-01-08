import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { sendPasswordReset } from '../../services/authService';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import AgritectumLogo from '../AgritectumLogo';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useIntl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('forgotPassword.error.emailRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          // Don't reveal if user exists - show success anyway for security
          setSuccess(true);
          break;
        case 'auth/invalid-email':
          setError(t('forgotPassword.error.invalidEmail'));
          break;
        case 'auth/too-many-requests':
          setError(t('forgotPassword.error.tooManyRequests'));
          break;
        default:
          setError(t('forgotPassword.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-material'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-8'>
            <AgritectumLogo size="xl" className="justify-center" />
          </div>
          <h2 className='mt-4 text-4xl font-light text-gray-900 tracking-tight'>
            {t('forgotPassword.title')}
          </h2>
          <p className='mt-3 text-base text-gray-600 font-light'>
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        <form className='mt-8 space-y-6 bg-white p-8 rounded-material shadow-material-4' onSubmit={handleSubmit}>
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
                    {t('forgotPassword.success.title')}
                  </h3>
                  <p className='mt-1 text-sm text-green-700'>
                    {t('forgotPassword.success.message', { email })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div className='space-y-6'>
                <div>
                  <label htmlFor='email' className='block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'>
                    {t('login.email')}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <Mail className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      autoComplete='email'
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className='block w-full pl-12 pr-4 py-3 border-b-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all duration-material font-light'
                      placeholder={t('login.placeholder.email') || 'kund@example.com'}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className='pt-4 space-y-3'>
                <button
                  type='submit'
                  disabled={loading}
                  className='group relative w-full flex justify-center py-3 px-6 text-base font-medium rounded-material text-white bg-blue-600 hover:bg-blue-700 shadow-material-2 hover:shadow-material-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-material uppercase tracking-wide'
                >
                  {loading ? <LoadingSpinner size='sm' /> : t('forgotPassword.sendResetLink')}
                </button>

                <Link
                  to='/login'
                  className='flex items-center justify-center w-full py-3 px-6 text-base font-medium rounded-material text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-material'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </>
          )}

          {success && (
            <div className='pt-4'>
              <Link
                to='/login'
                className='flex items-center justify-center w-full py-3 px-6 text-base font-medium rounded-material text-white bg-blue-600 hover:bg-blue-700 shadow-material-2 hover:shadow-material-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-material uppercase tracking-wide'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
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
                onError={(e) => {
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
              <span className='fallback-text ml-1.5 font-medium text-gray-700' style={{ display: 'none' }}>Agritectum</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;


