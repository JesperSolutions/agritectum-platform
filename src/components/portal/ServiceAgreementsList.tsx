import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { ServiceAgreement } from '../../types';
import { FileCheck, Calendar, Plus, Building2, Users } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FilterTabs from '../shared/filters/FilterTabs';
import StatusBadge from '../shared/badges/StatusBadge';
import IconLabel from '../shared/layouts/IconLabel';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import AddExternalProviderForm from './AddExternalProviderForm';
import { formatDate } from '../../utils/dateFormatter';

const ServiceAgreementsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'cancelled' | 'pending'>('all');
  const [showAddProviderForm, setShowAddProviderForm] = useState(false);

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
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleProviderAdded = () => {
    setShowAddProviderForm(false);
    loadAgreements();
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <PageHeader
          title='Service Agreements'
          subtitle='Manage your service agreements with roofers'
        />
        <button
          onClick={() => setShowAddProviderForm(true)}
          className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
        >
          <Plus className='w-5 h-5' />
          Add External Provider
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
            No service agreements found
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
                        External
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded'>
                        <Building2 className='w-3 h-3' />
                        Platform Partner
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
                  label='Start Date'
                  value={formatDate(agreement.startDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label='End Date'
                  value={formatDate(agreement.endDate)}
                />
                <IconLabel
                  icon={Calendar}
                  label='Next Service'
                  value={formatDate(agreement.nextServiceDate)}
                />
                {agreement.price && (
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Price</p>
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
