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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">
              Förhandsgranska offert
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Stäng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Kontrollera offerten nedan innan du skickar.</strong> Denna vy visar exakt hur kunden kommer att se offerten.
              </p>
            </div>

            {/* Offer Detail - Using the same component for consistency */}
            <div className="bg-white">
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
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={onConfirmSend}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Skickar...' : 'Skicka offert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;



