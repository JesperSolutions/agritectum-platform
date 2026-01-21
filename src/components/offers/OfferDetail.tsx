import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Offer, OfferStatusHistory } from '../../types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Send,
  ExternalLink,
} from 'lucide-react';

interface OfferDetailProps {
  offer: Offer;
  onSendReminder?: () => void;
  onExtendValidity?: () => void;
  onSendOffer?: () => void;
  onExportOffer?: () => void;
}

const OfferDetail: React.FC<OfferDetailProps> = ({
  offer,
  onSendReminder,
  onExtendValidity,
  onSendOffer,
  onExportOffer,
}) => {
  const navigate = useNavigate();
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [newValidUntil, setNewValidUntil] = useState('');

  const getStatusBadge = (status: Offer['status']) => {
    const badges: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> =
      {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
        accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
        rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
        awaiting_response: {
          color: 'bg-orange-100 text-orange-800',
          icon: AlertCircle,
          label: 'Awaiting Response',
        },
        expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' },
      };
    const fallback = { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Unknown' };
    const badge = badges[status as string] || fallback;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${badge.color}`}
      >
        <Icon className='w-5 h-5' />
        {badge.label}
      </span>
    );
  };

  const getDaysPending = (): number => {
    if (offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'expired') {
      return 0;
    }
    const sentDate = new Date(offer.sentAt);
    const now = new Date();
    const diff = now.getTime() - sentDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysPending = getDaysPending();
  const isOverdue = daysPending > 7 && offer.status === 'pending';

  const handleExtendValidity = () => {
    if (newValidUntil && onExtendValidity) {
      onExtendValidity();
      setShowExtendDialog(false);
      setNewValidUntil('');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Sticky Actions Bar */}
      <div className='sticky top-0 z-30 -mx-2 sm:mx-0'>
        <div className='backdrop-blur bg-white/70 border-b border-gray-200 px-2 sm:px-0'>
          <div className='max-w-7xl mx-auto py-3 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              {getStatusBadge(offer.status)}
              {isOverdue && (
                <span className='text-xs font-semibold text-red-600'>Overdue {daysPending}d</span>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => window.open(`/offer/public/${offer.id}`, '_blank')}
                className='px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700'
                title='Open public page'
              >
                Public Link
              </button>
              {offer.status === 'pending' && onSendOffer && (
                <button
                  onClick={onSendOffer}
                  className='px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700'
                >
                  Send Email
                </button>
              )}
              {onExportOffer && (
                <button
                  onClick={onExportOffer}
                  className='px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200'
                >
                  Export
                </button>
              )}
              {offer.status === 'pending' && onSendReminder && (
                <button
                  onClick={onSendReminder}
                  className='px-3 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700'
                >
                  Reminder
                </button>
              )}
              {offer.status === 'pending' && onExtendValidity && (
                <button
                  onClick={() => setShowExtendDialog(true)}
                  className='px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700'
                >
                  Extend
                </button>
              )}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/offer/public/${offer.id}`
                  );
                }}
                className='px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-blue-50 text-blue-700'
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className='flex items-center justify-between mt-2'>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center text-gray-600 hover:text-gray-900 transition-colors'
        >
          <ArrowLeft className='w-5 h-5 mr-2' />
          Back to Offers
        </button>
        <div />
      </div>

      {/* Alert for overdue offers */}
      {isOverdue && (
        <div className='bg-red-50 border-l-4 border-red-500 p-4'>
          <div className='flex'>
            <AlertCircle className='w-5 h-5 text-red-500 mr-3 mt-0.5' />
            <div>
              <p className='text-red-800 font-semibold'>Overdue Offer</p>
              <p className='text-red-600 text-sm'>
                This offer has been pending for {daysPending} days. Consider following up with the
                customer.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Offer Information */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>{offer.title}</h2>

            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  Description
                </h3>
                <p className='text-gray-700 whitespace-pre-wrap'>{offer.description}</p>
              </div>

              <div className='border-t border-gray-200 pt-4'>
                <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                  Pricing Breakdown
                </h3>
                <div className='space-y-2'>
                  <div className='flex justify-between py-2'>
                    <span className='text-gray-600'>Labor Cost:</span>
                    <span className='font-medium'>
                      {offer.laborCost.toLocaleString()} {offer.currency}
                    </span>
                  </div>
                  <div className='flex justify-between py-2'>
                    <span className='text-gray-600'>Material Cost:</span>
                    <span className='font-medium'>
                      {offer.materialCost.toLocaleString()} {offer.currency}
                    </span>
                  </div>
                  <div className='flex justify-between py-2'>
                    <span className='text-gray-600'>Travel Cost:</span>
                    <span className='font-medium'>
                      {offer.travelCost.toLocaleString()} {offer.currency}
                    </span>
                  </div>
                  <div className='flex justify-between py-2'>
                    <span className='text-gray-600'>Overhead:</span>
                    <span className='font-medium'>
                      {offer.overheadCost.toLocaleString()} {offer.currency}
                    </span>
                  </div>
                  <div className='flex justify-between py-2 border-t border-gray-200 pt-2'>
                    <span className='text-lg font-semibold text-gray-900'>Total Amount:</span>
                    <span className='text-2xl font-bold text-blue-600'>
                      {offer.totalAmount.toLocaleString()} {offer.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>
              {t('offers.detail.statusHistory') || 'Status History'}
            </h3>
            <div className='space-y-4'>
              {offer.statusHistory.map((history: OfferStatusHistory, index: number) => (
                <div key={index} className='flex items-start gap-4'>
                  <div className='flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2'></div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='font-medium text-gray-900'>{history.status}</p>
                      <p className='text-sm text-gray-500'>
                        {new Date(history.timestamp).toLocaleString('sv-SE')}
                      </p>
                    </div>
                    <p className='text-sm text-gray-600'>Changed by: {history.changedByName}</p>
                    {history.reason && (
                      <p className='text-sm text-gray-500 mt-1'>{history.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>
              {t('offers.detail.quickActions') || 'Quick Actions'}
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => window.open(`/offer/public/${offer.id}`, '_blank')}
                className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <ExternalLink className='w-4 h-4' />
                {t('offers.actions.viewPublicLink') || 'View Public Link'}
              </button>
              {offer.status === 'pending' && onSendReminder && (
                <button
                  onClick={onSendReminder}
                  className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                >
                  <Send className='w-4 h-4' />
                  {t('offers.actions.sendReminder') || 'Send Reminder'}
                </button>
              )}
              {offer.status === 'pending' && onExtendValidity && (
                <button
                  onClick={() => setShowExtendDialog(true)}
                  className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
                >
                  <Calendar className='w-4 h-4' />
                  Extend Validity
                </button>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Customer Information</h3>
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 font-semibold'>
                    {offer.customerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>{offer.customerName}</p>
                </div>
              </div>
              {offer.customerEmail && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='w-4 h-4' />
                  {offer.customerEmail}
                </div>
              )}
              {offer.customerPhone && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='w-4 h-4' />
                  {offer.customerPhone}
                </div>
              )}
              <div className='flex items-start gap-2 text-sm text-gray-600'>
                <MapPin className='w-4 h-4 mt-0.5' />
                <span>{offer.customerAddress}</span>
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Offer Details</h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Created:</span>
                <span className='font-medium'>
                  {new Date(offer.createdAt).toLocaleDateString('sv-SE')}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Sent:</span>
                <span className='font-medium'>
                  {new Date(offer.sentAt).toLocaleDateString('sv-SE')}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Valid Until:</span>
                <span className='font-medium'>
                  {new Date(offer.validUntil).toLocaleDateString('sv-SE')}
                </span>
              </div>
              {offer.respondedAt && (
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Responded:</span>
                  <span className='font-medium'>
                    {new Date(offer.respondedAt).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Follow-up Attempts:</span>
                <span className='font-medium'>{offer.followUpAttempts}</span>
              </div>
            </div>
          </div>

          {/* Link to Report */}
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Related Report</h3>
            <button
              onClick={() => navigate(`/report/view/${offer.reportId}`)}
              className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <ExternalLink className='w-4 h-4' />
              View Inspection Report
            </button>
          </div>
        </div>
      </div>

      {/* Extend Validity Dialog */}
      {showExtendDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Extend Offer Validity</h3>
            <p className='text-gray-600 mb-4'>Set a new expiration date for this offer.</p>
            <input
              type='date'
              value={newValidUntil}
              onChange={e => setNewValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4'
            />
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowExtendDialog(false);
                  setNewValidUntil('');
                }}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleExtendValidity}
                disabled={!newValidUntil}
                className='flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Extend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferDetail;
