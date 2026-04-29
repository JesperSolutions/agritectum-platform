import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import AgritectumLogo from '../AgritectumLogo';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useIntl();

  // Redirect after successful login based on user role
  useEffect(() => {
    if (currentUser && !loading) {
      if (currentUser.role === 'customer' || currentUser.userType === 'customer') {
        navigate('/portal/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('login.error.fillFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      // Navigation will be handled by useEffect when currentUser updates
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
        case 'auth/too-many-requests':
          setError(t('login.error.tooManyRequests'));
          break;
        default:
          setError(t('login.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#7DA8CC]/10 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-material'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-8'>
            <AgritectumLogo size='xl' className='justify-center' />
          </div>
          <h2 className='mt-4 text-4xl font-light text-gray-900 tracking-tight'>
            {t('login.subtitle')}
          </h2>
          <p className='mt-3 text-base text-gray-600 font-light'>{t('login.title')}</p>
        </div>

        <form
          className='mt-8 space-y-6 bg-white p-8 rounded-material shadow-material-4'
          onSubmit={handleSubmit}
        >
          {error && (
            <div className='rounded-material bg-[#DA5062]/10 p-4 border-l-4 border-[#DA5062]'>
              <div className='flex items-center'>
                <AlertCircle className='w-5 h-5 text-[#DA5062] flex-shrink-0' />
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-[#872a38]'>{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className='space-y-6'>
            <div>
              <label
                htmlFor='email'
                className='block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'
              >
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
                  className='block w-full pl-12 pr-4 py-3 border-b-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-[#7DA8CC] focus:outline-none transition-all duration-material font-light'
                  placeholder={t('login.placeholder.email') || 'kund@example.com'}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'
              >
                {t('login.password')}
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='block w-full pl-12 pr-4 py-3 border-b-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-[#7DA8CC] focus:outline-none transition-all duration-material font-light'
                  placeholder={t('login.placeholder.password') || 'Ange ditt lösenord'}
                />
              </div>
            </div>
          </div>

          <div className='pt-4 space-y-3'>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-3 px-6 text-base font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
            >
              {loading ? <LoadingSpinner size='sm' /> : t('login.signIn')}
            </button>

            <div className='text-center'>
              <Link
                to='/forgot-password'
                className='text-sm text-[#7DA8CC] hover:text-[#6890b3] font-medium'
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
          </div>
        </form>

        {/* Switch to Building Owner Portal */}
        <div className='mt-6 p-4 bg-[#A1BA53]/10 rounded-xl border border-[#A1BA53]/20'>
          <p className='text-sm text-slate-600 text-center'>
            {t('login.switchToPortal') || 'Are you a building owner?'}{' '}
            <Link
              to='/portal/login'
              className='font-medium text-[#A1BA53] hover:text-[#8aa344] underline-offset-4 hover:underline transition-colors'
            >
              {t('login.goToPortal') || 'Go to Owner Portal'} →
            </Link>
          </p>
        </div>

        {/* Back to landing */}
        <div className='mt-4 text-center'>
          <Link
            to='/welcome'
            className='text-sm text-slate-400 hover:text-slate-600 transition-colors'
          >
            ← {t('login.backToLanding') || 'Back to home'}
          </Link>
        </div>

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
                  // Hide image and show text fallback
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

export default LoginForm;
