import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getServiceAgreementsByCustomer, updateServiceAgreement } from '../../services/serviceAgreementService';
import { useToast } from '../../contexts/ToastContext';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';
import { ServiceAgreement } from '../../types';
import { FileCheck, Calendar, Plus, Building2, Users, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { AgreementsListSkeleton } from '../common/SkeletonLoader';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import AddExternalProviderForm from './AddExternalProviderForm';
import { formatDate } from '../../utils/dateFormatter';
import { getCurrencyCode } from '../../utils/currency';

const ServiceAgreementsList: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useIntl();
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'cancelled' | 'pending'>('all');
  const [showAddProviderForm, setShowAddProviderForm] = useState(false);
  const [updatingAgreement, setUpdatingAgreement] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadAgreements();
    }
  }, [currentUser]);

  const loadAgreements = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const customerId = currentUser.companyId || currentUser.uid;
      const data = await getServiceAgreementsByCustomer(customerId);
      setAgreements(data);
    } catch (error) {
      logger.error('Error loading service agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgreements = agreements.filter(agreement => {
    if (filter === 'all') return true;
    return agreement.status === filter;
  });

  if (loading) {
    return (
      <div className='space-y-6'>
        <PageHeader
          title={t('serviceAgreement.portal.title')}
          subtitle={t('serviceAgreement.portal.subtitle')}
        />
        <AgreementsListSkeleton count={4} />
      </div>
    );
  }

  const filterTabs = [
    { value: 'all', label: t('serviceAgreement.statusFilters.all') },
    { value: 'pending', label: t('serviceAgreement.statusFilters.pending') },
    { value: 'active', label: t('serviceAgreement.statusFilters.active') },
    { value: 'expired', label: t('serviceAgreement.statusFilters.expired') },
    { value: 'cancelled', label: t('serviceAgreement.statusFilters.cancelled') },
  ];

  const handleProviderAdded = () => {
    setShowAddProviderForm(false);
    loadAgreements();
  };

  const handleAutoRenewToggle = async (agreementId: string, currentValue: boolean) => {
    if (!currentUser) return;
    
    setUpdatingAgreement(agreementId);
    try {
      await updateServiceAgreement(agreementId, {
        autoRenew: !currentValue,
        renewalTermMonths: !currentValue ? 12 : undefined, // Default to 12 months if enabling
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setAgreements(prev =>
        prev.map(agreement =>
          agreement.id === agreementId
            ? { ...agreement, autoRenew: !currentValue, renewalTermMonths: !currentValue ? 12 : undefined }
            : agreement
        )
      );
      
      showSuccess(t('serviceAgreement.portal.autoRenewSuccess', { status: !currentValue ? t('serviceAgreement.portal.enabled') : t('serviceAgreement.portal.disabled') }));
    } catch (error) {
      logger.error('Error updating auto-renewal:', error);
      showError(t('serviceAgreement.portal.autoRenewError'));
    } finally {
      setUpdatingAgreement(null);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <PageHeader
          title={t('serviceAgreement.portal.title')}
          subtitle={t('serviceAgreement.portal.subtitle')}
        />
        <button
          onClick={() => setShowAddProviderForm(true)}
          className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          <Plus className='w-5 h-5' />
          {t('externalProvider.addNew')}
        </button>
      </div>

      <FilterTabs
        tabs={filterTabs}
        activeTab={filter}
        onTabChange={value => setFilter(value as 'all' | 'active' | 'expired' | 'cancelled' | 'pending')}
      />

      {filteredAgreements.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <FileCheck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>
            {t('serviceAgreement.noAgreements')}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredAgreements.map(agreement => (
            <ListCard key={agreement.id}>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-semibold text-gray-900'>{agreement.title}</h3>
                    {agreement.providerType === 'external' ? (
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded'>
                        <Users className='w-3 h-3' />
                        {t('serviceAgreement.portal.external')}
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded'>
                        <Building2 className='w-3 h-3' />
                        {t('serviceAgreement.portal.platformPartner')}
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-gray-600'>{agreement.agreementType}</p>
                </div>
                <StatusBadge status={agreement.status} />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.startDate')}
                  value={formatDate(agreement.startDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.endDate')}
                  value={formatDate(agreement.endDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.nextService')}
                  value={formatDate(agreement.nextServiceDate)}
                />
                {agreement.price && (
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{t('serviceAgreement.detail.price')}</p>
                    <p className='text-gray-900'>
                      {agreement.price} {agreement.currency || getCurrencyCode()}
                    </p>
                  </div>
                )}
              </div>

              {agreement.description && (
                <p className='mt-4 text-sm text-gray-600'>{agreement.description}</p>
              )}

              {/* Auto-Renewal Toggle */}
              {agreement.status === 'active' && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <RefreshCw className={`w-5 h-5 ${agreement.autoRenew ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{t('serviceAgreement.portal.autoRenewal')}</p>
                        <p className='text-xs text-gray-500'>
                          {agreement.autoRenew
                            ? t('serviceAgreement.portal.autoRenewEnabled', { months: agreement.renewalTermMonths || 12 })
                            : t('serviceAgreement.portal.autoRenewDisabled')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAutoRenewToggle(agreement.id, agreement.autoRenew || false)}
                      disabled={updatingAgreement === agreement.id}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        agreement.autoRenew ? 'bg-green-600 focus:ring-green-500' : 'bg-gray-200 focus:ring-gray-300'
                      } ${updatingAgreement === agreement.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      role='switch'
                      aria-checked={agreement.autoRenew}
                    >
                      <span className='sr-only'>Toggle auto-renewal</span>
                      <span
                        aria-hidden='true'
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          agreement.autoRenew ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {agreement.autoRenew && (
                    <div className='mt-2 bg-green-50 border border-green-200 rounded-lg p-3'>
                      <p className='text-xs text-green-800'>
                        ✓ {t('serviceAgreement.portal.autoRenewConfirmation', { date: formatDate(agreement.endDate), months: agreement.renewalTermMonths || 12 })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ListCard>
          ))}
        </div>
      )}

      {showAddProviderForm && (
        <AddExternalProviderForm
          onClose={() => setShowAddProviderForm(false)}
          onSuccess={handleProviderAdded}
        />
      )}
    </div>
  );
};

export default ServiceAgreementsList;
