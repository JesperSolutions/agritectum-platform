import React, { useState } from 'react';
import { ServiceAgreement } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import { X, Edit, Trash2, User, MapPin, Mail, Phone, Calendar, DollarSign, FileCheck, Clock, ExternalLink, Copy, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrencyAmount, Currency } from '../../utils/currencyUtils';

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
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

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

  const formatCurrency = (amount: number, currency?: string) => {
    const currencyCode = (currency as Currency) || 'SEK';
    return formatCurrencyAmount(amount, currencyCode, locale);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between z-10'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>{t('serviceAgreement.detail.title')}</h2>
            <p className='text-sm text-slate-600 mt-1'>{agreement.title}</p>
          </div>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg'
            aria-label={t('common.buttons.close')}
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='p-8 space-y-6'>
          {/* Status and Type Badges */}
          <div className='flex items-center gap-3'>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}>
              {t(`serviceAgreement.status.${agreement.status}`)}
            </span>
            <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800'>
              <FileCheck className='w-4 h-4 mr-1' />
              {t(`serviceAgreement.type.${agreement.agreementType}`)}
            </span>
          </div>

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
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.startDate')}</p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.startDate)}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.endDate')}</p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.endDate)}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.nextService')}</p>
                <p className='text-slate-900 font-bold text-lg'>
                  {formatDate(agreement.nextServiceDate)}
                </p>
                {daysUntilDue >= 0 && (
                  <p className={`text-sm mt-1 font-medium ${
                    daysUntilDue === 0 || daysUntilDue === 1 
                      ? 'text-orange-600' 
                      : daysUntilDue <= 3 
                      ? 'text-yellow-600' 
                      : 'text-slate-600'
                  }`}>
                    {daysUntilDue === 0
                      ? t('serviceAgreement.dueDate.today')
                      : daysUntilDue === 1
                      ? t('serviceAgreement.dueDate.tomorrow')
                      : `${daysUntilDue} ${t('serviceAgreement.dueDate.days')}`}
                  </p>
                )}
                {daysUntilDue < 0 && (
                  <p className='text-sm text-red-600 font-medium mt-1'>{t('serviceAgreement.dueDate.overdue')}</p>
                )}
              </div>
              {agreement.lastServiceDate && (
                <div>
                  <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.lastService')}</p>
                  <p className='text-slate-900 font-medium'>{formatDate(agreement.lastServiceDate)}</p>
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
            <p className='text-slate-900 font-medium'>{t(`serviceAgreement.frequency.${agreement.serviceFrequency}`)}</p>
            {agreement.serviceInterval && (
              <p className='text-sm text-slate-600 mt-2'>
                {t('serviceAgreement.form.serviceInterval')}: {agreement.serviceInterval} {t('serviceAgreement.dueDate.days')}
              </p>
            )}
          </div>

          {/* Price */}
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

          {/* Description */}
          {agreement.description && (
            <div>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>{t('serviceAgreement.form.description')}</h4>
              <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
                <p className='text-slate-700 whitespace-pre-wrap'>{agreement.description}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {agreement.notes && (
            <div>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3'>{t('serviceAgreement.detail.notes')}</h4>
              <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
                <p className='text-slate-700 whitespace-pre-wrap'>{agreement.notes}</p>
              </div>
            </div>
          )}

          {/* Public Link Section */}
          {agreement.isPublic && agreement.publicToken && (
            <div className='bg-blue-50 rounded-xl p-6 border border-blue-200'>
              <h4 className='text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2'>
                <ExternalLink className='w-4 h-4' />
                {t('serviceAgreement.detail.publicLink') || 'Public Link'}
              </h4>
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  readOnly
                  value={`${window.location.origin}/service-agreement/public/${agreement.publicToken}`}
                  className='flex-1 px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/service-agreement/public/${agreement.publicToken}`;
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    showSuccess(t('serviceAgreement.detail.linkCopied') || 'Link copied to clipboard');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
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
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/service-agreement/public/${agreement.publicToken}`;
                    window.open(url, '_blank');
                  }}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2'
                  title={t('serviceAgreement.detail.viewPublic') || 'View public page'}
                >
                  <ExternalLink className='w-4 h-4' />
                  {t('serviceAgreement.detail.view') || 'View'}
                </button>
              </div>
              {agreement.acceptedAt && (
                <p className='mt-3 text-sm text-green-700'>
                  ✓ {t('serviceAgreement.detail.acceptedOn') || 'Accepted on'} {formatDate(agreement.acceptedAt)}
                  {agreement.acceptedBy && ` ${t('serviceAgreement.detail.by') || 'by'} ${agreement.acceptedBy}`}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className='border-t border-slate-200 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.createdBy')}</p>
                <p className='text-slate-900 font-medium'>{agreement.createdByName}</p>
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide mb-1'>{t('serviceAgreement.detail.createdAt')}</p>
                <p className='text-slate-900 font-medium'>{formatDate(agreement.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-6 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium'
          >
            {t('common.buttons.close')}
          </button>
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
  );
};

export default ServiceAgreementDetail;

