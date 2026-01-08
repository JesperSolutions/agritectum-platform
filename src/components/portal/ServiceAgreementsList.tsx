import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { ServiceAgreement } from '../../types';
import { FileCheck, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const ServiceAgreementsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all');

  useEffect(() => {
    if (currentUser) {
      loadAgreements();
    }
  }, [currentUser]);

  const loadAgreements = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getServiceAgreementsByCustomer(currentUser.uid);
      setAgreements(data);
    } catch (error) {
      console.error('Error loading service agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ServiceAgreement['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'expired':
        return <XCircle className='w-5 h-5 text-red-600' />;
      case 'cancelled':
        return <XCircle className='w-5 h-5 text-gray-600' />;
      default:
        return <Clock className='w-5 h-5 text-yellow-600' />;
    }
  };

  const getStatusBadge = (status: ServiceAgreement['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const filteredAgreements = agreements.filter((agreement) => {
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

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Service Agreements</h1>
        <p className='mt-2 text-gray-600'>View your service agreements and contracts</p>
      </div>

      <div className='flex space-x-2'>
        {(['all', 'active', 'expired', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredAgreements.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center'>
          <FileCheck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>No service agreements found</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredAgreements.map((agreement) => (
            <div
              key={agreement.id}
              className='bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  {getStatusIcon(agreement.status)}
                  <div>
                    <h3 className='font-semibold text-gray-900'>{agreement.title}</h3>
                    <p className='text-sm text-gray-600'>{agreement.agreementType}</p>
                  </div>
                </div>
                {getStatusBadge(agreement.status)}
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Start Date</p>
                  <p className='text-gray-900'>
                    {new Date(agreement.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>End Date</p>
                  <p className='text-gray-900'>
                    {new Date(agreement.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Next Service</p>
                  <p className='text-gray-900'>
                    {new Date(agreement.nextServiceDate).toLocaleDateString()}
                  </p>
                </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceAgreementsList;


