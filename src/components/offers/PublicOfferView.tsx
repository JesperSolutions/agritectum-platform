import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOffer, respondToOfferPublic } from '../../services/offerService';
import { Offer } from '../../types';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { logOfferEvent } from '../../utils/logger';
import { useIntl } from '../../hooks/useIntl';

const PublicOfferView: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { t } = useIntl();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  useDocumentTitle(offer ? `Offer – ${offer.title}` : 'Offer');

  useEffect(() => {
    if (offer) {
      calculateDaysRemaining();
      const interval = setInterval(calculateDaysRemaining, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [offer]);

  // Auto-print support for export flow: when opened with ?print=1
  useEffect(() => {
    if (!offer) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === '1') {
        // Allow a brief tick so the content settles before printing
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch {}
  }, [offer]);

  const loadOffer = async () => {
    if (!offerId) {
      setError('Invalid offer ID');
      setLoading(false);
      return;
    }

    try {
      const fetchedOffer = await getOffer(offerId);
      if (!fetchedOffer) {
        setError('Offer not found');
        setLoading(false);
        return;
      }

      setOffer(fetchedOffer);
      try {
        if (fetchedOffer?.id) logOfferEvent({ type: 'offer_view', offerId: fetchedOffer.id });
      } catch {}
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!offer) return;

    // Support both Firestore Timestamp and legacy string
    const validUntil =
      (offer as any).validUntil && typeof (offer as any).validUntil?.toDate === 'function'
        ? (offer as any).validUntil.toDate()
        : new Date((offer as any).validUntil);
    const now = new Date();
    const diff = validUntil.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    setDaysRemaining(days);
    setIsExpired(days < 0);
  };

  const doAccept = async () => {
    if (!offer) return;

    setProcessing(true);
    try {
      await respondToOfferPublic(offer.id, 'accept', undefined, {
        name: customerName,
        email: customerEmail,
      });
      try {
        if (offer?.id) logOfferEvent({ type: 'offer_confirm_success', offerId: offer.id });
      } catch {}

      // Update UI immediately - optimistic update
      setOffer(prev =>
        prev
          ? { ...prev, status: 'accepted' as const, respondedAt: new Date().toISOString() }
          : null
      );

      // Small delay to show updated state before navigation
      setTimeout(() => {
        navigate('/offer/thank-you', {
          state: {
            offerId: offer.id,
            status: 'accepted',
            message: 'Offer accepted! We will contact you shortly to schedule the work.',
          },
        });
      }, 1000);
    } catch (err) {
      console.error('Error accepting offer:', err);
      // Revert optimistic update on error
      setOffer(prev => (prev ? { ...prev, status: 'pending' as const } : null));
      alert('Failed to accept offer. Please try again or contact us.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!offer || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      await respondToOfferPublic(offer.id, 'reject', rejectionReason);
      try {
        if (offer?.id) logOfferEvent({ type: 'offer_reject', offerId: offer.id });
      } catch {}

      // Update UI immediately - optimistic update
      setOffer(prev =>
        prev
          ? { ...prev, status: 'rejected' as const, respondedAt: new Date().toISOString() }
          : null
      );

      // Small delay to show updated state before navigation
      setTimeout(() => {
        navigate('/offer/thank-you', {
          state: {
            offerId: offer.id,
            status: 'rejected',
            message: 'Thank you for your feedback. We appreciate you taking the time to respond.',
          },
        });
      }, 1000);
    } catch (err) {
      console.error('Error rejecting offer:', err);
      // Revert optimistic update on error
      setOffer(prev => (prev ? { ...prev, status: 'pending' as const } : null));
      alert('Failed to submit rejection. Please try again or contact us.');
    } finally {
      setProcessing(false);
      setShowRejectDialog(false);
      setRejectionReason('');
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
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Offer Not Found</h1>
          <p className='text-gray-600 mb-6'>
            {error || 'The offer you are looking for does not exist or has been removed.'}
          </p>
          <button
            onClick={() => (window.location.href = 'https://agritectum.com')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const isExpiredOrResponded =
    isExpired || offer.status === 'accepted' || offer.status === 'rejected';

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-lg overflow-hidden mb-6'>
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6'>
            <h1 className='text-3xl font-bold text-white mb-2'>Agritectum Professional Roofing</h1>
            <p className='text-blue-100'>Your Roof Repair Offer</p>
          </div>

          {/* Status Banner */}
          {isExpired && (
            <div className='bg-red-50 border-l-4 border-red-500 p-4'>
              <div className='flex'>
                <XCircle className='w-5 h-5 text-red-500 mr-3 mt-0.5' />
                <div>
                  <p className='text-red-800 font-semibold'>Offer Expired</p>
                  <p className='text-red-600 text-sm'>This offer is no longer valid.</p>
                </div>
              </div>
            </div>
          )}

          {offer.status === 'accepted' && (
            <div className='bg-green-50 border-l-4 border-green-500 p-4'>
              <div className='flex'>
                <CheckCircle className='w-5 h-5 text-green-500 mr-3 mt-0.5' />
                <div>
                  <p className='text-green-800 font-semibold'>Offer Accepted</p>
                  <p className='text-green-600 text-sm'>Thank you! We will contact you shortly.</p>
                </div>
              </div>
            </div>
          )}

          {offer.status === 'rejected' && (
            <div className='bg-gray-50 border-l-4 border-gray-400 p-4'>
              <div className='flex'>
                <XCircle className='w-5 h-5 text-gray-500 mr-3 mt-0.5' />
                <div>
                  <p className='text-gray-800 font-semibold'>Offer Declined</p>
                  <p className='text-gray-600 text-sm'>Thank you for your response.</p>
                </div>
              </div>
            </div>
          )}

          {!isExpiredOrResponded && (
            <div className='bg-blue-50 border-l-4 border-blue-500 p-4'>
              <div className='flex'>
                <Clock className='w-5 h-5 text-blue-500 mr-3 mt-0.5' />
                <div>
                  <p className='text-blue-800 font-semibold'>
                    {daysRemaining > 0 ? `${daysRemaining} ${t('offers.public.daysRemaining')}` : t('offers.public.expiringSoon')}
                  </p>
                  <p className='text-blue-600 text-sm'>
                    {t('offers.public.validUntil')}{' '}
                    {((offer as any).validUntil &&
                    typeof (offer as any).validUntil?.toDate === 'function'
                      ? (offer as any).validUntil.toDate()
                      : new Date((offer as any).validUntil)
                    ).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offer Details */}
        <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>{offer.title}</h2>

          <div className='space-y-6'>
            {/* Customer Info */}
            <div>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                Customer Information
              </h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-900 font-medium'>{offer.customerName}</p>
                {offer.customerEmail && (
                  <p className='text-gray-600 text-sm'>{offer.customerEmail}</p>
                )}
                {offer.customerPhone && (
                  <p className='text-gray-600 text-sm'>{offer.customerPhone}</p>
                )}
                <p className='text-gray-600 text-sm'>{offer.customerAddress}</p>
              </div>
            </div>

            {/* Offer Description */}
            <div>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                Description
              </h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-700 whitespace-pre-wrap'>{offer.description}</p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                Pricing Breakdown
              </h3>
              <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Labor Cost:</span>
                  <span className='font-medium'>
                    {offer.laborCost.toLocaleString()} {offer.currency}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Material Cost:</span>
                  <span className='font-medium'>
                    {offer.materialCost.toLocaleString()} {offer.currency}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Travel Cost:</span>
                  <span className='font-medium'>
                    {offer.travelCost.toLocaleString()} {offer.currency}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Overhead:</span>
                  <span className='font-medium'>
                    {offer.overheadCost.toLocaleString()} {offer.currency}
                  </span>
                </div>
                <div className='flex justify-between border-t border-gray-300 pt-2 mt-2'>
                  <span className='text-lg font-semibold text-gray-900'>Total Amount:</span>
                  <span className='text-2xl font-bold text-blue-600'>
                    {offer.totalAmount.toLocaleString()} {offer.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isExpiredOrResponded && (
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <h3 className='text-xl font-bold text-gray-900 mb-4 text-center'>
              {t('offers.public.whatWouldYouLikeToDo')}
            </h3>
            <div className='flex flex-col sm:flex-row gap-4'>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={processing}
                className='flex-1 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              >
                <CheckCircle className='w-6 h-6 mr-2' />
                {processing ? t('offers.public.processing') : t('offers.public.acceptOffer')}
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={processing}
                className='flex-1 bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              >
                <XCircle className='w-6 h-6 mr-2' />
                {t('offers.public.declineOffer')}
              </button>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className='mt-6 text-center text-gray-600 text-sm'>
          <p>{t('offers.public.questions')}</p>
        </div>
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-material shadow-material-4 max-w-md w-full p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>{t('offers.public.declineDialogTitle')}</h3>
            <p className='text-gray-600 mb-4'>
              {t('offers.public.declineDialogMessage')}
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder={t('offers.public.reasonPlaceholder')}
              className='w-full border border-gray-300 rounded-material p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-material'
              rows={4}
            />
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className='flex-1 px-4 py-2 bg-red-600 text-white rounded-material hover:bg-red-700 transition-all duration-material disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {processing ? t('offers.public.submitting') : t('offers.public.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Accept Dialog */}
      {showConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Confirm Acceptance</h3>
            <p className='text-gray-600 mb-4'>
              Please confirm your details (optional) and acceptance of this offer.
            </p>
            <div className='space-y-3 mb-4'>
              <input
                type='text'
                placeholder='Your name (optional)'
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent'
              />
              <input
                type='email'
                placeholder='Your email (optional)'
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent'
              />
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowConfirm(false)}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    if (offer?.id) logOfferEvent({ type: 'offer_accept_click', offerId: offer.id });
                  } catch {}
                  doAccept();
                }}
                disabled={processing}
                className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {processing ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicOfferView;
