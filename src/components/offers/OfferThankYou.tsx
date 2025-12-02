import React from 'react';
import { useIntl } from '../../hooks/useIntl';

const OfferThankYou: React.FC = () => {
  const { t } = useIntl();
  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md w-full">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Thank You for Your Response!</h1>
      <p className="text-lg text-gray-700 mb-4">
        We appreciate your response. If you have accepted the offer, our team will contact you shortly to arrange the work. If you declined, thank you for your feedback.
      </p>
      <a
        href={import.meta.env.VITE_WEBSITE_URL || 'https://example.com'}
        className="mt-4 inline-block px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        {t('common.goToHomepage') || 'Go to Homepage'}
      </a>
    </div>
  </div>
  );
};

export default OfferThankYou;
