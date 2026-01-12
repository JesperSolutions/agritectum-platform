import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { getScheduledVisit, acceptScheduledVisit, rejectScheduledVisit } from '../../services/scheduledVisitService';
import { ScheduledVisit } from '../../types';
import { Calendar, MapPin, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '../ui/button';
import { formatDateTime } from '../../utils/dateFormatter';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';

const AcceptAppointmentView: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t } = useIntl();
  
  const [visit, setVisit] = useState<ScheduledVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (visitId) {
      loadVisit();
    }
  }, [visitId]);

  const loadVisit = async () => {
    if (!visitId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedVisit = await getScheduledVisit(visitId);
      
      if (!fetchedVisit) {
        setError(t('schedule.visits.notFound') || 'Scheduled visit not found');
        return;
      }

      // Verify token if provided
      if (token && fetchedVisit.publicToken !== token) {
        setError(t('schedule.visits.invalidToken') || 'Invalid access token');
        return;
      }

      // Check if already responded
      if (fetchedVisit.customerResponse && fetchedVisit.customerResponse !== 'pending') {
        setError(
          fetchedVisit.customerResponse === 'accepted'
            ? t('schedule.visits.alreadyAccepted') || 'This appointment has already been accepted'
            : t('schedule.visits.alreadyRejected') || 'This appointment has already been rejected'
        );
      }

      setVisit(fetchedVisit);
    } catch (err: any) {
      console.error('Error loading scheduled visit:', err);
      setError(err.message || t('schedule.visits.loadError') || 'Failed to load scheduled visit');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!visitId || !visit) return;

    const confirmed = window.confirm(
      t('schedule.visits.acceptConfirm') || 
      `Are you sure you want to accept the appointment on ${formatDateTime(visit.scheduledDate, visit.scheduledTime)}?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      await acceptScheduledVisit(visitId);
      await loadVisit();
      alert(t('schedule.visits.acceptedSuccess') || 'Appointment accepted! You will receive a reminder the day before.');
      navigate('/portal/scheduled-visits');
    } catch (err: any) {
      console.error('Error accepting appointment:', err);
      alert(err.message || t('schedule.visits.acceptError') || 'Failed to accept appointment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!visitId || !visit) return;

    if (showRejectForm) {
      // Submit rejection
      const confirmed = window.confirm(
        t('schedule.visits.rejectConfirm') || 
        'Are you sure you want to reject this appointment? This action cannot be undone.'
      );

      if (!confirmed) return;

      try {
        setProcessing(true);
        await rejectScheduledVisit(visitId, rejectReason.trim() || undefined);
        await loadVisit();
        alert(t('schedule.visits.rejectedSuccess') || 'Appointment rejected. Thank you for your feedback.');
        navigate('/portal/scheduled-visits');
      } catch (err: any) {
        console.error('Error rejecting appointment:', err);
        alert(err.message || t('schedule.visits.rejectError') || 'Failed to reject appointment. Please try again.');
      } finally {
        setProcessing(false);
      }
    } else {
      // Show reject form
      setShowRejectForm(true);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className='space-y-6'>
        <PageHeader
          title={t('schedule.visits.error') || 'Error'}
          subtitle={error || t('schedule.visits.notFound') || 'Scheduled visit not found'}
        />
        <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
          <p className='text-red-800'>{error || t('schedule.visits.notFound') || 'Scheduled visit not found'}</p>
        </div>
        <Button onClick={() => navigate('/portal/scheduled-visits')}>
          {t('common.back') || 'Back to Scheduled Visits'}
        </Button>
      </div>
    );
  }

  const isResponded = visit.customerResponse && visit.customerResponse !== 'pending';

  return (
    <div className='space-y-6'>
      <PageHeader
        title={t('schedule.visits.respondToAppointment') || 'Respond to Appointment'}
        subtitle={t('schedule.visits.respondSubtitle') || 'Please accept or deny this scheduled roof inspection'}
      />

      <ListCard>
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>{visit.title}</h2>
            <p className='text-sm text-gray-600'>{visit.visitType}</p>
          </div>
          <StatusBadge 
            status={visit.customerResponse === 'accepted' ? 'accepted' : visit.customerResponse === 'rejected' ? 'rejected' : 'pending'} 
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          <IconLabel
            icon={Calendar}
            label={t('schedule.visits.dateTime') || 'Date & Time'}
            value={formatDateTime(visit.scheduledDate, visit.scheduledTime)}
          />
          <IconLabel
            icon={MapPin}
            label={t('schedule.visits.location') || 'Location'}
            value={visit.customerAddress}
          />
          <IconLabel
            icon={User}
            label={t('schedule.visits.inspector') || 'Inspector'}
            value={visit.assignedInspectorName}
          />
        </div>

        {visit.description && (
          <div className='mb-6 p-4 bg-slate-50 rounded-lg'>
            <p className='text-sm font-medium text-slate-700 mb-2'>{t('schedule.visits.description') || 'Description'}</p>
            <p className='text-sm text-slate-600'>{visit.description}</p>
          </div>
        )}

        {isResponded ? (
          <div className={`p-4 rounded-lg ${
            visit.customerResponse === 'accepted' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className='flex items-center gap-2'>
              {visit.customerResponse === 'accepted' ? (
                <CheckCircle className='w-5 h-5 text-green-600' />
              ) : (
                <XCircle className='w-5 h-5 text-red-600' />
              )}
              <p className={`font-medium ${
                visit.customerResponse === 'accepted' ? 'text-green-800' : 'text-red-800'
              }`}>
                {visit.customerResponse === 'accepted'
                  ? t('schedule.visits.alreadyAccepted') || 'This appointment has already been accepted'
                  : t('schedule.visits.alreadyRejected') || 'This appointment has already been rejected'}
              </p>
            </div>
            {visit.customerResponseReason && (
              <p className='mt-2 text-sm text-slate-600'>
                <strong>{t('schedule.visits.reason') || 'Reason'}:</strong> {visit.customerResponseReason}
              </p>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {!showRejectForm ? (
              <div className='flex gap-4'>
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className='flex-1 bg-green-600 hover:bg-green-700 text-lg py-6'
                >
                  <CheckCircle className='w-5 h-5 mr-2' />
                  {t('schedule.visits.accept') || 'Accept Appointment'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant='outline'
                  className='flex-1 border-red-300 text-red-700 hover:bg-red-50 text-lg py-6'
                >
                  <XCircle className='w-5 h-5 mr-2' />
                  {t('schedule.visits.reject') || 'Reject Appointment'}
                </Button>
              </div>
            ) : (
              <div className='space-y-4 p-4 bg-slate-50 rounded-lg'>
                <div>
                  <label htmlFor='rejectReason' className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('schedule.visits.rejectReasonLabel') || 'Reason for Rejection (Optional)'}
                  </label>
                  <textarea
                    id='rejectReason'
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    placeholder={t('schedule.visits.rejectReasonPlaceholder') || 'Please let us know why you\'re rejecting this appointment...'}
                  />
                </div>
                <div className='flex gap-4'>
                  <Button
                    onClick={handleReject}
                    disabled={processing}
                    className='flex-1 bg-red-600 hover:bg-red-700 text-white'
                  >
                    {processing ? t('common.processing') || 'Processing...' : t('schedule.visits.confirmReject') || 'Confirm Rejection'}
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(false)}
                    disabled={processing}
                    variant='outline'
                    className='flex-1'
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ListCard>
    </div>
  );
};

export default AcceptAppointmentView;
