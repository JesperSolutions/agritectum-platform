/**
 * Create Service Agreement Form
 * Allows customers to create service agreements for their buildings
 * with external (customer-added) providers only
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Building, ExternalServiceProvider } from '../../types';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getExternalProvidersByCompany } from '../../services/externalProviderService';
import * as serviceAgreementService from '../../services/serviceAgreementService';
import { X, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface CreateServiceAgreementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  buildingId?: string;
}

const CreateServiceAgreementForm: React.FC<CreateServiceAgreementFormProps> = ({
  onClose,
  onSuccess,
  buildingId: preselectedBuildingId,
}) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [externalProviders, setExternalProviders] = useState<ExternalServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState<string>(preselectedBuildingId || '');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [agreementTitle, setAgreementTitle] = useState('');
  const [agreementType, setAgreementType] = useState<'maintenance' | 'other'>('maintenance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('DKK');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const companyId = currentUser.companyId || currentUser.uid;
      const buildingsList = await getBuildingsByCustomer(companyId);
      setBuildings(buildingsList);

      const providers = await getExternalProvidersByCompany(companyId);
      setExternalProviders(providers);
    } catch (error) {
      logger.error('Error loading data:', error);
      showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedBuilding) {
      newErrors.building = 'Building is required';
    }
    if (!selectedProvider) {
      newErrors.provider = 'Service provider is required';
    }
    if (!agreementTitle.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentUser) return;

    setSubmitting(true);
    try {
      const companyId = currentUser.companyId || currentUser.uid;
      const agreement = {
        title: agreementTitle.trim(),
        customerId: companyId,
        companyId: companyId,
        buildingId: selectedBuilding,
        agreementType: agreementType,
        providerType: 'external' as const,
        externalProviderId: selectedProvider,
        startDate: startDate,
        endDate: endDate,
        description: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency,
        status: 'active' as const,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await serviceAgreementService.createServiceAgreement(agreement);

      showSuccess('Service agreement created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Error creating service agreement:', error);
      showError('Failed to create service agreement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg p-8'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900'>Create Service Agreement</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-900'>
              <p className='font-semibold mb-1'>Service Agreement</p>
              <p>Set up a service agreement for your building with one of your added service providers.</p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>Building *</label>
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.building ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value=''>Select a building...</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name || building.address}
                </option>
              ))}
            </select>
            {errors.building && <p className='text-sm text-red-600 mt-1'>{errors.building}</p>}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>Service Provider *</label>

            {externalProviders.length === 0 ? (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800'>
                <p className='font-semibold mb-2'>No service providers added yet</p>
                <p>Please add a service provider first by clicking "Add External Provider".</p>
              </div>
            ) : (
              <select
                value={selectedProvider}
                onChange={e => setSelectedProvider(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.provider ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value=''>Select service provider...</option>
                {externalProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.companyName} ({provider.contactName})
                  </option>
                ))}
              </select>
            )}
            {errors.provider && <p className='text-sm text-red-600 mt-1'>{errors.provider}</p>}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>Agreement Title *</label>
            <input
              type='text'
              value={agreementTitle}
              onChange={e => setAgreementTitle(e.target.value)}
              placeholder='e.g., Annual Roof Maintenance 2026'
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className='text-sm text-red-600 mt-1'>{errors.title}</p>}
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>Agreement Type</label>
            <select
              value={agreementType}
              onChange={e => setAgreementType(e.target.value as 'maintenance' | 'other')}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='maintenance'>Maintenance</option>
              <option value='other'>Other</option>
            </select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>Start Date *</label>
              <input
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className='text-sm text-red-600 mt-1'>{errors.startDate}</p>}
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>End Date *</label>
              <input
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className='text-sm text-red-600 mt-1'>{errors.endDate}</p>}
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='col-span-2'>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>Price</label>
              <input
                type='number'
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder='e.g., 5000'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                step='0.01'
                min='0'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='DKK'>DKK</option>
                <option value='EUR'>EUR</option>
                <option value='USD'>USD</option>
                <option value='SEK'>SEK</option>
                <option value='NOK'>NOK</option>
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Additional details about this service agreement...'
              rows={3}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <div className='flex gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold'
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={submitting}
              className='flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {submitting ? (
                <>
                  <LoadingSpinner size='sm' />
                  Creating...
                </>
              ) : (
                <>Create Agreement</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceAgreementForm;
