/**
 * Offer Preview Modal
 *
 * Shows a preview of the offer before sending it to the customer.
 * Uses the same layout as OfferDetail for consistency.
 */

import React from 'react';
import { X } from 'lucide-react';
import { Offer } from '../../types';
import OfferDetail from './OfferDetail';
import { useIntl } from '../../hooks/useIntl';

interface OfferPreviewModalProps {
  offer: Offer;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: () => void;
  isLoading?: boolean;
}

const OfferPreviewModal: React.FC<OfferPreviewModalProps> = ({
  offer,
  isOpen,
  onClose,
  onConfirmSend,
  isLoading = false,
}) => {
  const { t } = useIntl();

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div className='relative bg-white rounded-material shadow-material-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
            <h2 className='text-xl font-medium text-gray-900'>
              {t('offers.preview.title')}
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-all duration-material hover:rotate-90'
              aria-label={t('offers.preview.close')}
            >
              <X className='w-6 h-6' />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div className='mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-material shadow-material-1'>
              <p className='text-sm text-blue-800 leading-relaxed'>
                {t('offers.preview.checkBeforeSending')}
              </p>
            </div>

            {/* Offer Detail - Using the same component for consistency */}
            <div className='bg-white'>
              <OfferDetail
                offer={offer}
                onSendOffer={undefined} // Don't show send button in preview
                onExtendValidity={undefined}
                onSendReminder={undefined}
                onExportOffer={undefined}
              />
            </div>
          </div>

          {/* Footer with Actions */}
          <div className='px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-end gap-3'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className='px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-material hover:shadow-material-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-material uppercase tracking-wide'
            >
              {t('offers.preview.cancel')}
            </button>
            <button
              onClick={onConfirmSend}
              disabled={isLoading}
              className='px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-material hover:bg-green-700 hover:shadow-material-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-material uppercase tracking-wide'
            >
              {isLoading ? t('offers.preview.sending') : t('offers.preview.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
