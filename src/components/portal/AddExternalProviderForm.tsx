/**
 * Add External Service Provider Form
 * Allows customers to add external roofers to the system
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';
import { ExternalServiceProvider } from '../../types';
import { createExternalProvider, searchExistingProviders } from '../../services/externalProviderService';
import { X, Building, Mail, Phone, MapPin, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface AddExternalProviderFormProps {
  onClose: () => void;
  onSuccess: (providerId: string) => void;
}

const AddExternalProviderForm: React.FC<AddExternalProviderFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [searchingDuplicates, setSearchingDuplicates] = useState(false);
  const [duplicateProviders, setDuplicateProviders] = useState<ExternalServiceProvider[]>([]);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    cvr: '',
    notes: '',
    isShared: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('validation.required') || 'Required';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = t('validation.required') || 'Required';
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required') || 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail') || 'Invalid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.required') || 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = async () => {
    if (!formData.companyName.trim()) return;

    setSearchingDuplicates(true);
    try {
      const companyId = currentUser?.companyId || currentUser?.uid;
      const existing = await searchExistingProviders(
        formData.companyName,
        formData.cvr || undefined,
        companyId
      );
      setDuplicateProviders(existing);
    } catch (error) {
      logger.error('Error searching duplicates:', error);
    } finally {
      setSearchingDuplicates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentUser) return;

    setLoading(true);
    try {
      const providerId = await createExternalProvider({
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        cvr: formData.cvr.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        addedByCustomerId: currentUser.uid,
        addedByCompanyId: currentUser.companyId || currentUser.uid,
        isShared: formData.isShared,
        invitationStatus: 'none',
      });

      showSuccess(t('externalProvider.created') || 'External provider added successfully');
      onSuccess(providerId);
    } catch (error) {
      logger.error('Error creating provider:', error);
      showError(t('externalProvider.createError') || 'Failed to add external provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900'>
            {t('externalProvider.addNew') || 'Add External Roofer'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Info Banner */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-900'>
              <p className='font-semibold mb-1'>
                {t('externalProvider.infoTitle') || 'Add roofers not yet on the platform'}
              </p>
              <p>
                {t('externalProvider.infoText') ||
                  'You can add external roofers to track all your service agreements in one place. We can invite them to join later.'}
              </p>
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicateProviders.length > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex gap-3'>
                <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-yellow-900 mb-2'>
                    Similar provider(s) found:
                  </p>
                  {duplicateProviders.map(provider => (
                    <div key={provider.id} className='text-sm text-yellow-800 mb-1'>
                      • {provider.companyName}
                      {provider.cvr && ` (CVR: ${provider.cvr})`}
                    </div>
                  ))}
                  <p className='text-xs text-yellow-700 mt-2'>
                    Check if this is the same company before creating a new entry.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              {t('externalProvider.companyName') || 'Company Name'} *
            </label>
            <input
              type='text'
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              onBlur={checkForDuplicates}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.companyName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., ABC Roofing ApS'
            />
            {errors.companyName && (
              <p className='text-sm text-red-600 mt-1'>{errors.companyName}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              {t('externalProvider.contactName') || 'Contact Person'} *
            </label>
            <input
              type='text'
              value={formData.contactName}
              onChange={e => setFormData({ ...formData, contactName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.contactName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., John Hansen'
            />
            {errors.contactName && (
              <p className='text-sm text-red-600 mt-1'>{errors.contactName}</p>
            )}
          </div>

          {/* Email & Phone Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>
                {t('common.email') || 'Email'} *
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='contact@roofing.dk'
              />
              {errors.email && <p className='text-sm text-red-600 mt-1'>{errors.email}</p>}
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-900 mb-2'>
                {t('common.phone') || 'Phone'} *
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='+45 12 34 56 78'
              />
              {errors.phone && <p className='text-sm text-red-600 mt-1'>{errors.phone}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              {t('common.address') || 'Address'}
            </label>
            <input
              type='text'
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Street, City, Postal Code'
            />
          </div>

          {/* CVR */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              {t('externalProvider.cvr') || 'CVR Number'}
            </label>
            <input
              type='text'
              value={formData.cvr}
              onChange={e => setFormData({ ...formData, cvr: e.target.value })}
              onBlur={checkForDuplicates}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='12345678'
            />
            <p className='text-xs text-gray-600 mt-1'>
              {t('externalProvider.cvrHelp') || 'Company registration number (helps avoid duplicates)'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              {t('common.notes') || 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              rows={3}
              placeholder='Any additional information about this provider...'
            />
          </div>

          {/* Share Option */}
          <div className='flex items-start gap-3 p-4 bg-gray-50 rounded-lg'>
            <input
              type='checkbox'
              id='isShared'
              checked={formData.isShared}
              onChange={e => setFormData({ ...formData, isShared: e.target.checked })}
              className='mt-1'
            />
            <label htmlFor='isShared' className='flex-1 text-sm text-gray-700 cursor-pointer'>
              <span className='font-semibold block mb-1'>
                {t('externalProvider.shareWithCompany') || 'Share with my company'}
              </span>
              <span className='text-gray-600'>
                {t('externalProvider.shareHelp') ||
                  'Allow other users in my company to use this provider for their service agreements'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold'
              disabled={loading}
            >
              {t('common.buttons.cancel') || 'Cancel'}
            </button>
            <button
              type='submit'
              disabled={loading || searchingDuplicates}
              className='flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <LoadingSpinner size='sm' />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                <>{t('externalProvider.addButton') || 'Add Provider'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExternalProviderForm;
