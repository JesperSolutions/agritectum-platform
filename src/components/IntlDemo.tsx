import React from 'react';
import { useIntl } from '../hooks/useIntl';

const IntlDemo: React.FC = () => {
  const { t, formatCurrency, formatDate, formatNumber, formatRelativeTime } = useIntl();

  const sampleDate = new Date('2024-09-15');
  const sampleNumber = 1234567.89;
  const sampleCurrency = 50000;

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm border border-gray-200'>
      <h2 className='text-xl font-bold mb-4'>React-Intl Demo - Swedish Localization</h2>

      <div className='space-y-4'>
        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Basic Translations:</h3>
          <ul className='space-y-1 text-sm'>
            <li>
              <strong>App Title:</strong> {t('app.title')}
            </li>
            <li>
              <strong>Dashboard:</strong> {t('dashboard.title')}
            </li>
            <li>
              <strong>New Report:</strong> {t('reports.new')}
            </li>
            <li>
              <strong>Send Offer:</strong> {t('reports.sendOffer')}
            </li>
          </ul>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Status Translations:</h3>
          <div className='flex flex-wrap gap-2'>
            <span className='px-2 py-1 bg-[#DA5062]/15 text-[#872a38] rounded text-sm'>
              {t('report.status.draft')}
            </span>
            <span className='px-2 py-1 bg-[#A1BA53]/15 text-[#5c6a2f] rounded text-sm'>
              {t('report.status.completed')}
            </span>
            <span className='px-2 py-1 bg-[#956098]/15 text-[#553657] rounded text-sm'>
              {t('report.status.offerSent')}
            </span>
            <span className='px-2 py-1 bg-[#DA5062]/15 text-[#872a38] rounded text-sm'>
              {t('report.status.offerRejected')}
            </span>
          </div>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Currency Formatting:</h3>
          <p className='text-sm'>
            <strong>Sample Value:</strong> {formatCurrency(sampleCurrency)}
          </p>
          <p className='text-sm'>
            <strong>Different Currencies:</strong>{' '}
            {formatNumber(sampleCurrency, { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Date Formatting:</h3>
          <p className='text-sm'>
            <strong>Short Date:</strong> {formatDate(sampleDate, { dateStyle: 'short' })}
          </p>
          <p className='text-sm'>
            <strong>Long Date:</strong> {formatDate(sampleDate, { dateStyle: 'full' })}
          </p>
          <p className='text-sm'>
            <strong>Time:</strong> {formatDate(sampleDate, { timeStyle: 'short' })}
          </p>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Number Formatting:</h3>
          <p className='text-sm'>
            <strong>Decimal:</strong> {formatNumber(sampleNumber)}
          </p>
          <p className='text-sm'>
            <strong>Percentage:</strong> {formatNumber(0.75, { style: 'percent' })}
          </p>
          <p className='text-sm'>
            <strong>Compact:</strong> {formatNumber(sampleNumber, { notation: 'compact' })}
          </p>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Relative Time:</h3>
          <p className='text-sm'>
            <strong>2 days ago:</strong> {formatRelativeTime(-2, 'day')}
          </p>
          <p className='text-sm'>
            <strong>In 3 hours:</strong> {formatRelativeTime(3, 'hour')}
          </p>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Roof Types (Swedish):</h3>
          <div className='flex flex-wrap gap-2'>
            <span className='px-2 py-1 bg-[#7DA8CC]/15 text-[#476279] rounded text-sm'>
              {t('roofTypes.tile')}
            </span>
            <span className='px-2 py-1 bg-[#7DA8CC]/15 text-[#476279] rounded text-sm'>
              {t('roofTypes.metal')}
            </span>
            <span className='px-2 py-1 bg-[#7DA8CC]/15 text-[#476279] rounded text-sm'>
              {t('roofTypes.shingle')}
            </span>
            <span className='px-2 py-1 bg-[#7DA8CC]/15 text-[#476279] rounded text-sm'>
              {t('roofTypes.slate')}
            </span>
          </div>
        </div>

        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>Issue Severity (Swedish):</h3>
          <div className='flex flex-wrap gap-2'>
            <span className='px-2 py-1 bg-[#A1BA53]/15 text-[#5c6a2f] rounded text-sm'>
              {t('severity.low')}
            </span>
            <span className='px-2 py-1 bg-[#DA5062]/15 text-[#872a38] rounded text-sm'>
              {t('severity.medium')}
            </span>
            <span className='px-2 py-1 bg-[#DA5062]/15 text-[#872a38] rounded text-sm'>
              {t('severity.high')}
            </span>
            <span className='px-2 py-1 bg-[#DA5062]/15 text-[#872a38] rounded text-sm'>
              {t('severity.critical')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntlDemo;
