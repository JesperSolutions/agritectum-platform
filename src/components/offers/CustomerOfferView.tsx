import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import { Offer } from '../../types';
import { getOffer, acceptOffer, rejectOffer } from '../../services/offerService';
import OfferStatusBadge from './OfferStatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '../ui/button';

/**
 * Customer Offer View Component
 * Public view for customers to view and respond to offers
 */
const CustomerOfferView: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { t } = useIntl();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (offerId) {
      loadOffer();
    }
  }, [offerId]);

  const loadOffer = async () => {
    if (!offerId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedOffer = await getOffer(offerId);
      setOffer(fetchedOffer);
    } catch (err) {
      logger.error('Error loading offer:', err);
      setError('Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!offerId) return;

    const confirmed = window.confirm(t('common.acceptOfferConfirmation'));

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await acceptOffer(offerId);
      await loadOffer();
      showSuccess('Offer accepted! We will contact you shortly.');
    } catch (err) {
      logger.error('Error accepting offer:', err);
      showError('Failed to accept offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!offerId) return;

    if (!rejectReason.trim()) {
      showWarning(t('offers.rejectionReasonRequired'));
      return;
    }

    const confirmed = window.confirm(t('common.rejectOfferConfirmation'));

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await rejectOffer(offerId, rejectReason);
      await loadOffer();
      setShowRejectForm(false);
      setRejectReason('');
      showSuccess('Offer rejected. Thank you for your feedback.');
    } catch (err) {
      logger.error('Error rejecting offer:', err);
      showError('Failed to reject offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Offer Not Found</h1>
          <p className='text-gray-600 mb-6'>
            {error || 'The offer you are looking for could not be found.'}
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(offer.validUntil) < new Date();
  const canRespond = offer.status === 'pending' && !isExpired;

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
          <div className='flex items-start justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>{offer.title}</h1>
              <p className='text-gray-600 mt-2'>Dear {offer.customerName},</p>
            </div>
            <OfferStatusBadge status={offer.status} size='lg' showIcon />
          </div>

          {isExpired && offer.status === 'pending' && (
            <div className='bg-[#DA5062]/10 border border-[#DA5062]/30 rounded-lg p-4 mb-6'>
              <p className='text-[#872a38] font-medium'>
                ⚠️ This offer has expired on {new Date(offer.validUntil).toLocaleDateString()}
              </p>
              <p className='text-[#DA5062] text-sm mt-1'>
                Please contact us if you would like to discuss this offer.
              </p>
            </div>
          )}

          {offer.status === 'accepted' && (
            <div className='bg-[#A1BA53]/10 border border-[#A1BA53]/30 rounded-lg p-4 mb-6'>
              <p className='text-[#5c6a2f] font-medium'>✓ You have accepted this offer</p>
              <p className='text-[#A1BA53] text-sm mt-1'>
                We will contact you shortly to proceed with the work.
              </p>
            </div>
          )}

          {offer.status === 'rejected' && (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6'>
              <p className='text-gray-800 font-medium'>You have rejected this offer</p>
              <p className='text-gray-600 text-sm mt-1'>
                Thank you for your feedback. We appreciate your time.
              </p>
            </div>
          )}
        </div>

        {/* Offer Details */}
        <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>Offer Details</h2>

          {/* Description */}
          {offer.description && (
            <div className='mb-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Description</h3>
              <p className='text-gray-700 whitespace-pre-wrap'>{offer.description}</p>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className='border-t pt-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Pricing Breakdown</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Labor Cost</span>
                <span className='font-medium'>
                  {offer.laborCost.toLocaleString()} {offer.currency}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Material Cost</span>
                <span className='font-medium'>
                  {offer.materialCost.toLocaleString()} {offer.currency}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Travel Cost</span>
                <span className='font-medium'>
                  {offer.travelCost.toLocaleString()} {offer.currency}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Overhead</span>
                <span className='font-medium'>
                  {offer.overheadCost.toLocaleString()} {offer.currency}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Profit Margin</span>
                <span className='font-medium'>
                  {offer.profitMargin.toLocaleString()} {offer.currency}
                </span>
              </div>
              <div className='border-t pt-3 flex justify-between text-lg font-bold'>
                <span>Total Amount</span>
                <span className='text-[#7DA8CC]'>
                  {offer.totalAmount.toLocaleString()} {offer.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className='mt-6 pt-6 border-t'>
            <p className='text-sm text-gray-600'>
              This offer is valid until{' '}
              <span className='font-medium'>{new Date(offer.validUntil).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canRespond && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <h2 className='text-xl font-bold text-gray-900 mb-6'>Your Response</h2>

            {!showRejectForm ? (
              <div className='flex gap-4'>
                <Button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className='flex-1 bg-[#A1BA53] hover:bg-[#8a9f47] text-lg py-6'
                >
                  ✓ Accept Offer
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  variant='outline'
                  className='flex-1 border-[#DA5062]/40 text-[#c23d4f] hover:bg-[#DA5062]/10 text-lg py-6'
                >
                  ✗ Reject Offer
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='rejectReason'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    id='rejectReason'
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DA5062]'
                    placeholder="Please let us know why you're rejecting this offer..."
                  />
                </div>
                <div className='flex gap-4'>
                  <Button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className='flex-1 bg-[#DA5062] hover:bg-[#c23d4f]'
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                    disabled={actionLoading}
                    variant='outline'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        <div className='mt-6 bg-[#7DA8CC]/10 border border-[#7DA8CC]/30 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-[#3b5060] mb-2'>Questions?</h3>
          <p className='text-[#476279]'>
            If you have any questions about this offer, please contact us at{' '}
            <a href={`mailto:${offer.customerEmail}`} className='underline hover:text-[#3b5060]'>
              {offer.customerEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerOfferView;
