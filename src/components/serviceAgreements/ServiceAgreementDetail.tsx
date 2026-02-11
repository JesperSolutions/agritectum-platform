import React, { useState } from 'react';
import { ServiceAgreement } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import {
  X,
  Edit,
  Trash2,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileCheck,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Send,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { sendServiceAgreementToCustomerPortal } from '../../services/serviceAgreementService';
import { useAuth } from '../../contexts/AuthContext';

interface ServiceAgreementDetailProps {
  agreement: ServiceAgreement;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ServiceAgreementDetail: React.FC<ServiceAgreementDetailProps> = ({
  agreement,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t, locale } = useIntl();
  const { showSuccess, showError } = useToast();
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getDaysUntilDue = (nextServiceDate: string): number => {
    const now = new Date();
    const dueDate = new Date(nextServiceDate);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilDue = getDaysUntilDue(agreement.nextServiceDate);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Get currency based on locale
  const getCurrencyForLocale = (): string => {
    if (locale.startsWith('da')) return 'DKK';
    if (locale.startsWith('de')) return 'EUR';
    return 'SEK'; // Default to SEK for Swedish
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const defaultCurrency = currency || getCurrencyForLocale();
    // Use the locale from useIntl hook to get proper formatting (1.123,50 format)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSend = async () => {
    if (!agreement.customerId) {
      showError(
        t('serviceAgreement.detail.noCustomer') || 'Customer ID is required to send the agreement'
      );
      return;
    }

    setSending(true);
    try {
      await sendServiceAgreementToCustomerPortal(agreement.id, agreement.customerId);
      showSuccess(
        t('serviceAgreement.detail.sentPortal') || 'Service agreement sent to customer portal successfully'
      );
    } catch (error) {
      logger.error('Error sending service agreement:', error);
      showError(t('serviceAgreement.detail.sendError') || 'Failed to send service agreement');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200'>
        {/* Header with Status and Actions */}
        <div className='sticky top-0 bg-white border-b border-slate-200 px-8 py-6 z-10'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
                {t('serviceAgreement.detail.title')}
              </h2>
              <p className='text-sm text-slate-600 mt-1'>{agreement.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className='text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg'
              aria-label={t('common.buttons.close')}
            >
              <X className='h-6 w-6' />
            </button>
          </div>

          {/* Status Badge and Action Buttons */}
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div className='flex items-center gap-3'>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}
              >
                {t(`serviceAgreement.status.${agreement.status}`)}
              </span>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800'>
                <FileCheck className='w-4 h-4 mr-1' />
                {t(`serviceAgreement.type.${agreement.agreementType}`)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
              {agreement.publicToken && (
                <>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/service-agreement/public/${agreement.publicToken}`;
                      window.open(url, '_blank');
                    }}
                    className='px-3 py-2 rounded-lg text-sm font-medium bg-slate-600 text-white hover:bg-slate-700 flex items-center gap-2'
                    title={t('serviceAgreement.detail.viewPublic') || 'View public page'}
                  >
                    <ExternalLink className='w-4 h-4' />
                    {t('serviceAgreement.detail.publicLink') || 'Public Link'}
                  </button>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/service-agreement/public/${agreement.publicToken}`;
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      showSuccess(
                        t('serviceAgreement.detail.linkCopied') || 'Link copied to clipboard'
                      );
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className='px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2'
                    title={t('serviceAgreement.detail.copyLink') || 'Copy link'}
                  >
                    {copied ? (
                      <>
                        <Check className='w-4 h-4' />
                        {t('serviceAgreement.detail.copied') || 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className='w-4 h-4' />
                        {t('serviceAgreement.detail.copy') || 'Copy'}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='p-8 space-y-6'>
          {/* Customer Info */}
          <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
            <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <User className='w-4 h-4' />
              {t('serviceAgreement.detail.customer')}
            </h4>
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
          <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
            <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              {t('serviceAgreement.detail.dates')}
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                  {t('serviceAgreement.detail.startDate')}
                </p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.startDate)}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                  {t('serviceAgreement.detail.endDate')}
                </p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.endDate)}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                  {t('serviceAgreement.detail.nextService')}
                </p>
                <p className='text-slate-900 font-bold text-lg'>
                  {formatDate(agreement.nextServiceDate)}
                </p>
                {daysUntilDue >= 0 && (
                  <p
                    className={`text-sm mt-1 font-medium ${
                      daysUntilDue === 0 || daysUntilDue === 1
                        ? 'text-orange-600'
                        : daysUntilDue <= 3
                          ? 'text-yellow-600'
                          : 'text-slate-600'
                    }`}
                  >
                    {daysUntilDue === 0
                      ? t('serviceAgreement.dueDate.today')
                      : daysUntilDue === 1
                        ? t('serviceAgreement.dueDate.tomorrow')
                        : `${daysUntilDue} ${t('serviceAgreement.dueDate.days')}`}
                  </p>
                )}
                {daysUntilDue < 0 && (
                  <p className='text-sm text-red-600 font-medium mt-1'>
                    {t('serviceAgreement.dueDate.overdue')}
                  </p>
                )}
              </div>
              {agreement.lastServiceDate && (
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                    {t('serviceAgreement.detail.lastService')}
                  </p>
                  <p className='text-slate-900 font-medium'>
                    {formatDate(agreement.lastServiceDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
            <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              {t('serviceAgreement.detail.frequency')}
            </h4>
            <p className='text-slate-900 font-medium'>
              {t(`serviceAgreement.frequency.${agreement.serviceFrequency}`)}
            </p>
            {agreement.serviceInterval && (
              <p className='text-sm text-slate-600 mt-2'>
                {t('serviceAgreement.form.serviceInterval')}: {agreement.serviceInterval}{' '}
                {t('serviceAgreement.dueDate.days')}
              </p>
            )}
          </div>

          {/* Purpose */}
          {agreement.purpose && (
            <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                {t('serviceAgreement.form.purpose.title') || '1. AFTALENS FORMÅL'}
              </h4>
              <p className='text-slate-700 whitespace-pre-wrap'>{agreement.purpose}</p>
            </div>
          )}

          {/* Service Visits */}
          {agreement.serviceVisits &&
            (agreement.serviceVisits.oneAnnual || agreement.serviceVisits.twoAnnual) && (
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                  {t('serviceAgreement.form.services.serviceVisits') || 'SERVICEBESØG:'}
                </h4>
                <div className='space-y-2'>
                  {agreement.serviceVisits.oneAnnual && (
                    <div className='flex items-center gap-2 text-slate-700'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <span>
                        {t('serviceAgreement.form.services.oneAnnual') || '1 årligt servicebesøg'}
                      </span>
                    </div>
                  )}
                  {agreement.serviceVisits.twoAnnual && (
                    <div className='flex items-center gap-2 text-slate-700'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <span>
                        {t('serviceAgreement.form.services.twoAnnual') || '2 årlige servicebesøg'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Standard Services */}
          {agreement.standardServices && agreement.standardServices.length > 0 && (
            <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                {t('serviceAgreement.form.services.standardServices') || 'STANDARDYDELSER:'}
              </h4>
              <div className='space-y-2'>
                {agreement.standardServices.map(service => (
                  <div key={service} className='flex items-center gap-2 text-slate-700'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                    <span>{t(`serviceAgreement.form.services.${service}`) || service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {agreement.addons &&
            (agreement.addons.skylights?.length ||
              agreement.addons.solar?.length ||
              agreement.addons.steel?.length ||
              agreement.addons.sedum?.length) && (
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                  {t('serviceAgreement.form.addons.title') || '3. TILLÆG (VALGFRIE YDELSER)'}
                </h4>
                <div className='space-y-4'>
                  {agreement.addons.skylights && agreement.addons.skylights.length > 0 && (
                    <div>
                      <h5 className='text-sm font-medium text-slate-800 mb-2'>
                        {t('serviceAgreement.form.addons.skylights.title') ||
                          'OVENLYS & FALDSIKRING:'}
                      </h5>
                      <div className='space-y-1 pl-4'>
                        {agreement.addons.skylights.map(addon => (
                          <div key={addon} className='flex items-center gap-2 text-slate-700'>
                            <CheckCircle className='w-4 h-4 text-green-600' />
                            <span className='text-sm'>
                              {t(`serviceAgreement.form.addons.${addon}`) || addon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {agreement.addons.solar && agreement.addons.solar.length > 0 && (
                    <div>
                      <h5 className='text-sm font-medium text-slate-800 mb-2'>
                        {t('serviceAgreement.form.addons.solar.title') || 'SOLCELLER:'}
                      </h5>
                      <div className='space-y-1 pl-4'>
                        {agreement.addons.solar.map(addon => (
                          <div key={addon} className='flex items-center gap-2 text-slate-700'>
                            <CheckCircle className='w-4 h-4 text-green-600' />
                            <span className='text-sm'>
                              {t(`serviceAgreement.form.addons.${addon}`) || addon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {agreement.addons.steel && agreement.addons.steel.length > 0 && (
                    <div>
                      <h5 className='text-sm font-medium text-slate-800 mb-2'>
                        {t('serviceAgreement.form.addons.steel.title') || 'STÅLTAG:'}
                      </h5>
                      <div className='space-y-1 pl-4'>
                        {agreement.addons.steel.map(addon => (
                          <div key={addon} className='flex items-center gap-2 text-slate-700'>
                            <CheckCircle className='w-4 h-4 text-green-600' />
                            <span className='text-sm'>
                              {t(`serviceAgreement.form.addons.${addon}`) || addon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {agreement.addons.sedum && agreement.addons.sedum.length > 0 && (
                    <div>
                      <h5 className='text-sm font-medium text-slate-800 mb-2'>
                        {t('serviceAgreement.form.addons.sedum.title') || 'SEDUMTAG (GRØNT TAG):'}
                      </h5>
                      <div className='space-y-1 pl-4'>
                        {agreement.addons.sedum.map(addon => (
                          <div key={addon} className='flex items-center gap-2 text-slate-700'>
                            <CheckCircle className='w-4 h-4 text-green-600' />
                            <span className='text-sm'>
                              {t(`serviceAgreement.form.addons.${addon}`) || addon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Pricing Structure */}
          {agreement.pricingStructure &&
            (agreement.pricingStructure.perRoof || agreement.pricingStructure.perSquareMeter) && (
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2'>
                  <DollarSign className='w-4 h-4' />
                  {t('serviceAgreement.form.pricing.title') || '6. PRIS & FAKTURERING'}
                </h4>
                <div className='space-y-3'>
                  {agreement.pricingStructure.perRoof && (
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-600'>
                        {t('serviceAgreement.form.pricing.perRoof') || 'Opstarts pris per tag:'}
                      </span>
                      <span className='text-slate-900 font-bold text-lg'>
                        {formatCurrency(
                          agreement.pricingStructure.perRoof,
                          agreement.currency || 'DKK'
                        )}
                      </span>
                    </div>
                  )}
                  {agreement.pricingStructure.perSquareMeter && (
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-600'>
                        {t('serviceAgreement.form.pricing.perSquareMeter') || 'Pris pr. år per m²:'}
                      </span>
                      <span className='text-slate-900 font-bold text-lg'>
                        {formatCurrency(
                          agreement.pricingStructure.perSquareMeter,
                          agreement.currency || 'DKK'
                        )}{' '}
                        / m²
                      </span>
                    </div>
                  )}
                  {agreement.billingFrequency && (
                    <div className='flex justify-between items-center pt-2 border-t border-slate-200'>
                      <span className='text-slate-600'>
                        {t('serviceAgreement.form.pricing.billingFrequency') ||
                          'Faktureringsfrekvens:'}
                      </span>
                      <span className='text-slate-900 font-medium'>
                        {agreement.billingFrequency === 'annual'
                          ? t('serviceAgreement.form.pricing.annual') || 'Årlig betaling'
                          : t('serviceAgreement.form.pricing.semiAnnual') || 'Halvårlig betaling'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Price (legacy) */}
          {agreement.price && (
            <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2'>
                <DollarSign className='w-4 h-4' />
                {t('serviceAgreement.detail.price')}
              </h4>
              <p className='text-slate-900 text-2xl font-bold'>
                {formatCurrency(agreement.price, agreement.currency)}
              </p>
            </div>
          )}

          {/* Signatures */}
          {agreement.signatures &&
            (agreement.signatures.supplier ||
              agreement.signatures.customer ||
              agreement.signatures.supplierImageUrl ||
              agreement.signatures.customerImageUrl) && (
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4'>
                  {t('serviceAgreement.form.signatures.title') || '7. UNDERSKRIFTER'}
                </h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-xs text-slate-500 uppercase tracking-wide mb-2'>
                      {t('serviceAgreement.form.signatures.supplier') || 'Leverandør:'}
                    </p>
                    {agreement.signatures.supplierImageUrl ? (
                      <img
                        src={agreement.signatures.supplierImageUrl}
                        alt='Supplier signature'
                        className='h-20 w-auto border border-slate-300 rounded'
                      />
                    ) : (
                      <p className='text-slate-900 font-medium'>
                        {agreement.signatures.supplier || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 uppercase tracking-wide mb-2'>
                      {t('serviceAgreement.form.signatures.customer') || 'Kunde:'}
                    </p>
                    {agreement.signatures.customerImageUrl ? (
                      <img
                        src={agreement.signatures.customerImageUrl}
                        alt='Customer signature'
                        className='h-20 w-auto border border-slate-300 rounded'
                      />
                    ) : (
                      <p className='text-slate-900 font-medium'>
                        {agreement.signatures.customer || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Notes */}
          {agreement.notes && (
            <div>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>
                {t('serviceAgreement.detail.notes')}
              </h4>
              <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
                <p className='text-slate-700 whitespace-pre-wrap'>{agreement.notes}</p>
              </div>
            </div>
          )}

          {/* Acceptance Status */}
          {agreement.acceptedAt && (
            <div className='bg-green-50 rounded-xl p-6 border border-green-200'>
              <div className='flex items-center gap-2 text-green-800'>
                <CheckCircle className='w-5 h-5' />
                <p className='font-semibold'>
                  {t('serviceAgreement.detail.accepted') || 'Agreement Accepted'}
                </p>
              </div>
              <p className='mt-2 text-sm text-green-700'>
                {t('serviceAgreement.detail.acceptedOn') || 'Accepted on'}{' '}
                {formatDate(agreement.acceptedAt)}
                {agreement.acceptedBy &&
                  ` ${t('serviceAgreement.detail.by') || 'by'} ${agreement.acceptedBy}`}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className='border-t border-slate-200 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                  {t('serviceAgreement.detail.createdBy')}
                </p>
                <p className='text-slate-900 font-medium'>{agreement.createdByName}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>
                  {t('serviceAgreement.detail.createdAt')}
                </p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6 flex justify-between gap-3'>
          <button
            onClick={onClose}
            className='px-6 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium'
          >
            {t('common.buttons.close')}
          </button>
          <div className='flex gap-3'>
            <button
              onClick={onEdit}
              className='px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium uppercase tracking-wide flex items-center gap-2 shadow-sm hover:shadow-md'
            >
              <Edit className='h-5 w-5' />
              {t('serviceAgreement.editAgreement')}
            </button>
            <button
              onClick={onDelete}
              className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium uppercase tracking-wide flex items-center gap-2 shadow-sm hover:shadow-md'
            >
              <Trash2 className='h-5 w-5' />
              {t('serviceAgreement.deleteAgreement')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAgreementDetail;
