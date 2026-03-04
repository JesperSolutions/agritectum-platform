import React from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from '../hooks/useIntl';
import AgritectumLogo from './AgritectumLogo';
import { Wrench, Building2, ArrowRight } from 'lucide-react';

/**
 * Landing page with two distinct entry points:
 * - Roofer / Inspector login (admin)
 * - Building Owner portal login (customer)
 */
const LandingPage: React.FC = () => {
  const { t } = useIntl();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center px-4 py-12'>
      {/* Decorative background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-96 h-96 bg-[#A1BA53]/10 rounded-full blur-3xl'></div>
        <div className='absolute -bottom-40 -left-40 w-96 h-96 bg-[#7DA8CC]/10 rounded-full blur-3xl'></div>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#956098]/5 rounded-full blur-3xl'></div>
      </div>

      {/* Logo & Heading */}
      <div className='relative text-center mb-12'>
        <div className='flex justify-center mb-6'>
          <AgritectumLogo size='xl' showText={true} />
        </div>
        <h1 className='text-3xl sm:text-4xl font-light text-slate-900 tracking-tight'>
          {t('landing.title') || 'Welcome to Agritectum'}
        </h1>
        <p className='mt-3 text-base sm:text-lg text-slate-600 font-light max-w-md mx-auto'>
          {t('landing.subtitle') || 'Choose how you want to sign in'}
        </p>
      </div>

      {/* Two Portal Cards */}
      <div className='relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-3xl'>
        {/* Roofer / Admin Card */}
        <Link
          to='/login'
          className='group relative bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/80 p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden'
        >
          {/* Accent strip */}
          <div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-700 to-slate-900 rounded-t-2xl'></div>

          <div className='flex flex-col items-center text-center space-y-5'>
            <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300'>
              <Wrench className='w-8 h-8 text-white' />
            </div>

            <div>
              <h2 className='text-xl font-semibold text-slate-900'>
                {t('landing.roofer.title') || 'Roofer Portal'}
              </h2>
              <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                {t('landing.roofer.description') || 'For inspectors, branch admins and administrators'}
              </p>
            </div>

            <div className='flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors'>
              <span>{t('landing.roofer.cta') || 'Go to login'}</span>
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </div>
          </div>
        </Link>

        {/* Building Owner Card */}
        <Link
          to='/portal/login'
          className='group relative bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/80 p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden'
        >
          {/* Accent strip */}
          <div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A1BA53] to-[#8aa344] rounded-t-2xl'></div>

          <div className='flex flex-col items-center text-center space-y-5'>
            <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A1BA53] to-[#8aa344] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300'>
              <Building2 className='w-8 h-8 text-white' />
            </div>

            <div>
              <h2 className='text-xl font-semibold text-slate-900'>
                {t('landing.owner.title') || 'Building Owner Portal'}
              </h2>
              <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                {t('landing.owner.description') || 'For building owners and property managers'}
              </p>
            </div>

            <div className='flex items-center gap-2 text-sm font-medium text-[#A1BA53] group-hover:text-[#8aa344] transition-colors'>
              <span>{t('landing.owner.cta') || 'Go to portal'}</span>
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className='relative mt-12 text-center text-sm text-slate-400'>
        <p>&copy; {new Date().getFullYear()} Agritectum</p>
      </div>
    </div>
  );
};

export default LandingPage;
