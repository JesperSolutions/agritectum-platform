import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { ServiceAgreement } from '../../types';
import { FileCheck, Calendar } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import { formatDate } from '../../utils/dateFormatter';

const ServiceAgreementsList: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'cancelled' | 'pending'>('all');

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
      console.error('Error loading service agreements:', error);
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
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const filterTabs = [
    { value: 'all', label: t('common.filters.all') || 'All' },
    { value: 'pending', label: t('serviceAgreement.status.pending') || 'Pending' },
    { value: 'active', label: t('serviceAgreement.status.active') || 'Active' },
    { value: 'expired', label: t('serviceAgreement.status.expired') || 'Expired' },
    { value: 'cancelled', label: t('serviceAgreement.status.cancelled') || 'Cancelled' },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        title={t('serviceAgreement.title') || 'Service Agreements'}
        subtitle={t('serviceAgreement.subtitle') || 'View your service agreements and contracts'}
      />

      <FilterTabs
        tabs={filterTabs}
        activeTab={filter}
        onTabChange={value => setFilter(value as 'all' | 'active' | 'expired' | 'cancelled' | 'pending')}
      />

      {filteredAgreements.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <FileCheck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>
            {t('serviceAgreement.noAgreements') || 'No service agreements found'}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredAgreements.map(agreement => (
            <ListCard key={agreement.id}>
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='font-semibold text-gray-900'>{agreement.title}</h3>
                  <p className='text-sm text-gray-600'>{agreement.agreementType}</p>
                </div>
                <StatusBadge status={agreement.status} />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.startDate') || 'Start Date'}
                  value={formatDate(agreement.startDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.endDate') || 'End Date'}
                  value={formatDate(agreement.endDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label={t('serviceAgreement.detail.nextService') || 'Next Service'}
                  value={formatDate(agreement.nextServiceDate)}
                />
                {agreement.price && (
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      {t('serviceAgreement.price') || 'Price'}
                    </p>
                    <p className='text-gray-900'>
                      {agreement.price} {agreement.currency || 'DKK'}
                    </p>
                  </div>
                )}
              </div>

              {agreement.description && (
                <p className='mt-4 text-sm text-gray-600'>{agreement.description}</p>
              )}
            </ListCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceAgreementsList;
