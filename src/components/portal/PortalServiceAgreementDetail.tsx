import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getServiceAgreement } from '../../services/serviceAgreementService';
import { ServiceAgreement } from '../../types';
import {
  ArrowLeft,
  Calendar,
  FileCheck,
  User,
  MapPin,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../shared/badges/StatusBadge';
import PageHeader from '../shared/layouts/PageHeader';
import { formatDate } from '../../utils/dateFormatter';

const PortalServiceAgreementDetail: React.FC = () => {
  const { agreementId } = useParams<{ agreementId: string }>();
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<ServiceAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agreementId && currentUser) {
      loadAgreement();
    }
  }, [agreementId, currentUser]);

  const loadAgreement = async () => {
    if (!agreementId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceAgreement(agreementId);
      if (!data) {
        setError('Service agreement not found');
        return;
      }
      setAgreement(data);
    } catch (err: any) {
      console.error('Error loading service agreement:', err);
      setError(err.message || 'Failed to load service agreement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <h2 className='text-xl font-semibold text-red-800 mb-2'>
            {t('serviceAgreement.errorLoading') || 'Error Loading Service Agreement'}
          </h2>
          <p className='text-red-600 mb-4'>{error}</p>
          <button
            onClick={() => navigate('/portal/service-agreements')}
            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
          >
            {t('common.buttons.back') || 'Back to Service Agreements'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 space-y-6'>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className='flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        {t('common.buttons.back') || 'Back'}
      </button>

      {/* Header */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold text-slate-900 mb-2'>{agreement.title}</h1>
            <div className='flex items-center gap-3'>
              <StatusBadge status={agreement.status} />
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800'>
                <FileCheck className='w-4 h-4 mr-1' />
                {t(`serviceAgreement.type.${agreement.agreementType}`) || agreement.agreementType}
              </span>
            </div>
          </div>
        </div>

        {agreement.description && (
          <p className='text-slate-600 mt-4'>{agreement.description}</p>
        )}
      </div>

      {/* Customer Information */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
          <User className='w-5 h-5' />
          {t('serviceAgreement.public.customerInfo') || 'Customer Information'}
        </h2>
        <div className='space-y-3'>
          <p className='text-lg font-semibold text-slate-900'>{agreement.customerName}</p>
          {agreement.customerAddress && (
            <div className='flex items-start gap-2 text-sm text-slate-600'>
              <MapPin className='w-4 h-4 mt-0.5 flex-shrink-0' />
              <span>{agreement.customerAddress}</span>
            </div>
          )}
          <div className='flex flex-wrap gap-4'>
            {agreement.customerEmail && (
              <div className='flex items-center gap-2 text-sm text-slate-600'>
                <Mail className='w-4 h-4' />
                <span>{agreement.customerEmail}</span>
              </div>
            )}
            {agreement.customerPhone && (
              <div className='flex items-center gap-2 text-sm text-slate-600'>
                <Phone className='w-4 h-4' />
                <span>{agreement.customerPhone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
          <Calendar className='w-5 h-5' />
          {t('serviceAgreement.public.dates') || 'Important Dates'}
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
              {t('serviceAgreement.detail.startDate') || 'Start Date'}
            </p>
            <p className='text-slate-900 font-medium'>{formatDate(agreement.startDate)}</p>
          </div>
          <div>
            <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
              {t('serviceAgreement.detail.endDate') || 'End Date'}
            </p>
            <p className='text-slate-900 font-medium'>{formatDate(agreement.endDate)}</p>
          </div>
          <div>
            <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
              {t('serviceAgreement.detail.nextService') || 'Next Service'}
            </p>
            <p className='text-slate-900 font-medium'>{formatDate(agreement.nextServiceDate)}</p>
          </div>
          <div>
            <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
              {t('serviceAgreement.detail.frequency') || 'Service Frequency'}
            </p>
            <p className='text-slate-900 font-medium'>
              {t(`serviceAgreement.frequency.${agreement.serviceFrequency}`) || agreement.serviceFrequency}
            </p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      {agreement.purpose && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4'>
            {t('serviceAgreement.public.purpose') || '1. AFTALENS FORMÅL'}
          </h2>
          <p className='text-slate-700 whitespace-pre-wrap'>{agreement.purpose}</p>
        </div>
      )}

      {/* Service Visits */}
      {agreement.serviceVisits &&
        (agreement.serviceVisits.oneAnnual || agreement.serviceVisits.twoAnnual) && (
          <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
            <h2 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.public.serviceVisits') || 'SERVICEBESØG'}
            </h2>
            <div className='space-y-2'>
              {agreement.serviceVisits.oneAnnual && (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  <span className='text-slate-700'>
                    {t('serviceAgreement.form.services.oneAnnual') || '1 årligt servicebesøg'}
                  </span>
                </div>
              )}
              {agreement.serviceVisits.twoAnnual && (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  <span className='text-slate-700'>
                    {t('serviceAgreement.form.services.twoAnnual') ||
                      '2 årlige servicebesøg'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Standard Services */}
      {agreement.standardServices && agreement.standardServices.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4'>
            {t('serviceAgreement.public.standardServices') || 'STANDARDYDELSER'}
          </h2>
          <div className='space-y-2'>
            {agreement.standardServices.map((service, index) => (
              <div key={index} className='flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                <span className='text-slate-700'>
                  {t(`serviceAgreement.form.services.${service}`) || service}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      {(agreement.pricingStructure?.perRoof || agreement.pricingStructure?.perSquareMeter) && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
            <DollarSign className='w-5 h-5' />
            {t('serviceAgreement.public.pricing') || '6. PRIS & FAKTURERING'}
          </h2>
          <div className='space-y-3'>
            {agreement.pricingStructure.perRoof && (
              <div className='flex justify-between'>
                <span className='text-slate-600'>
                  {t('serviceAgreement.form.pricing.perRoof') || 'Pris start pr. år per tag:'}
                </span>
                <span className='text-slate-900 font-medium'>
                  {agreement.pricingStructure.perRoof} kr.
                </span>
              </div>
            )}
            {agreement.pricingStructure.perSquareMeter && (
              <div className='flex justify-between'>
                <span className='text-slate-600'>
                  {t('serviceAgreement.form.pricing.perSquareMeter') || 'Pris pr. m²:'}
                </span>
                <span className='text-slate-900 font-medium'>
                  {agreement.pricingStructure.perSquareMeter} kr. / m²
                </span>
              </div>
            )}
            {agreement.billingFrequency && (
              <div className='flex justify-between'>
                <span className='text-slate-600'>
                  {t('serviceAgreement.form.pricing.billingFrequency') ||
                    'Faktureringsfrekvens:'}
                </span>
                <span className='text-slate-900 font-medium'>
                  {t(`serviceAgreement.form.pricing.${agreement.billingFrequency}`) ||
                    agreement.billingFrequency}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acceptance Status */}
      {agreement.acceptedAt && (
        <div className='bg-green-50 rounded-lg border border-green-200 p-6'>
          <div className='flex items-center gap-2 text-green-800'>
            <CheckCircle className='w-5 h-5' />
            <p className='font-semibold'>
              {t('serviceAgreement.public.accepted') || 'Serviceaftale accepteret'}
            </p>
          </div>
          <p className='mt-2 text-sm text-green-700'>
            {t('serviceAgreement.detail.acceptedOn') || 'Accepteret den'}{' '}
            {formatDate(agreement.acceptedAt)}
            {agreement.acceptedBy &&
              ` ${t('serviceAgreement.detail.by') || 'af'} ${agreement.acceptedBy}`}
          </p>
        </div>
      )}

      {/* Notes */}
      {agreement.notes && (
        <div className='bg-white rounded-lg shadow p-6 border border-slate-200'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4'>
            {t('serviceAgreement.detail.notes') || 'Notes'}
          </h2>
          <p className='text-slate-700 whitespace-pre-wrap'>{agreement.notes}</p>
        </div>
      )}

      {/* Link to Building if exists */}
      {agreement.buildingId && (
        <div className='flex justify-center'>
          <Link
            to={`/portal/buildings/${agreement.buildingId}`}
            className='inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm hover:shadow-md'
          >
            {t('buildings.viewDetails') || 'Vis bygning'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default PortalServiceAgreementDetail;
