import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { ServiceAgreement, Customer } from '../../types';
import {
  X,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  X as XIcon,
  Image as ImageIcon,
} from 'lucide-react';
import {
  createServiceAgreement,
  updateServiceAgreement,
} from '../../services/serviceAgreementService';
import { getCustomers, getCustomerById } from '../../services/customerService';
import DateInput from '../DateInput';
import { uploadImageToStorage, compressImage } from '../../services/imageUploadService';

interface ServiceAgreementFormProps {
  mode: 'create' | 'edit';
  agreement?: ServiceAgreement;
  onClose: () => void;
  onSuccess: () => void;
}

const ServiceAgreementForm: React.FC<ServiceAgreementFormProps> = ({
  mode,
  agreement,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { t, locale } = useIntl();
  const { showSuccess, showError } = useToast();

  // Get default currency based on locale
  const getDefaultCurrency = (): string => {
    if (locale.startsWith('da')) return 'DKK';
    if (locale.startsWith('de')) return 'EUR';
    return 'SEK'; // Default to SEK for Swedish
  };

  const defaultCurrency = getDefaultCurrency();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    agreementType: 'maintenance' as 'maintenance' | 'other',
    startDate: '',
    endDate: '',
    nextServiceDate: '',
    serviceFrequency: 'annual' as 'quarterly' | 'biannual' | 'annual',
    status: 'active' as 'active' | 'expired' | 'cancelled' | 'pending',
    notes: '',
    // Paper version fields
    purpose: '',
    serviceVisits: {
      oneAnnual: false,
      twoAnnual: false,
    },
    standardServices: [] as string[],
    addons: {
      skylights: [] as string[],
      solar: [] as string[],
      steel: [] as string[],
      sedum: [] as string[],
    },
    pricingStructure: {
      perRoof: '',
      perSquareMeter: '',
    },
    billingFrequency: 'annual' as 'annual' | 'semi-annual',
    signatures: {
      supplier: '',
      customer: '',
      supplierImageUrl: '',
      customerImageUrl: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedAddons, setExpandedAddons] = useState<Record<string, boolean>>({
    skylights: false,
    solar: false,
    steel: false,
    sedum: false,
  });
  const [uploadingSignature, setUploadingSignature] = useState<{
    supplier: boolean;
    customer: boolean;
  }>({
    supplier: false,
    customer: false,
  });
  const supplierImageInputRef = useRef<HTMLInputElement>(null);
  const customerImageInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async () => {
    if (!currentUser) return;

    try {
      setLoadingCustomers(true);
      setCustomerError(null);
      const branchId = currentUser.role === 'superadmin' ? undefined : currentUser.branchId;
      const customersData = await getCustomers(branchId);
      setCustomers(customersData);
      if (customersData.length === 0) {
        setCustomerError('noCustomers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomerError('fetchError');
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (mode === 'edit' && agreement && agreement.customerId) {
      // When editing, ensure the customer is in the list
      const selectedCustomer = customers.find(c => c.id === agreement.customerId);

      // If customer not found in list, fetch it separately (might be from different branch)
      if (!selectedCustomer && agreement.customerId) {
        getCustomerById(agreement.customerId)
          .then(customer => {
            if (customer) {
              setCustomers(prev => {
                // Only add if not already in list
                if (!prev.find(c => c.id === customer.id)) {
                  return [...prev, customer];
                }
                return prev;
              });
            }
          })
          .catch(error => {
            console.error('Error fetching customer for agreement:', error);
          });
      }

      // Handle backwards compatibility for agreementType
      const agreementType =
        agreement.agreementType === 'inspection' || agreement.agreementType === 'repair'
          ? 'other'
          : agreement.agreementType === 'maintenance'
            ? 'maintenance'
            : 'other';

      // Handle backwards compatibility for serviceFrequency
      let serviceFrequency: 'quarterly' | 'biannual' | 'annual' = 'annual';
      if (agreement.serviceFrequency === 'quarterly') {
        serviceFrequency = 'quarterly';
      } else if (agreement.serviceFrequency === 'biannual') {
        serviceFrequency = 'biannual';
      } else if (agreement.serviceFrequency === 'annual') {
        serviceFrequency = 'annual';
      } else {
        // Convert old frequencies to closest match
        if (agreement.serviceFrequency === 'weekly' || agreement.serviceFrequency === 'monthly') {
          serviceFrequency = 'quarterly';
        } else {
          serviceFrequency = 'annual';
        }
      }

      setFormData({
        customerId: agreement.customerId,
        agreementType,
        startDate: agreement.startDate.split('T')[0],
        endDate: agreement.endDate.split('T')[0],
        nextServiceDate: agreement.nextServiceDate.split('T')[0],
        serviceFrequency,
        status: agreement.status,
        notes: agreement.notes || '',
        // Paper version fields
        purpose: agreement.purpose || '',
        serviceVisits: agreement.serviceVisits || { oneAnnual: false, twoAnnual: false },
        standardServices: agreement.standardServices || [],
        addons: agreement.addons || { skylights: [], solar: [], steel: [], sedum: [] },
        pricingStructure: agreement.pricingStructure || { perRoof: '', perSquareMeter: '' },
        billingFrequency: agreement.billingFrequency || 'annual',
        signatures: agreement.signatures || {
          supplier: '',
          customer: '',
          supplierImageUrl: '',
          customerImageUrl: '',
        },
      });
    }
  }, [mode, agreement, customers]);

  // Auto-fill service visits based on frequency (only when frequency changes, not on initial load)
  const [prevFrequency, setPrevFrequency] = useState<string | null>(null);
  useEffect(() => {
    // Only auto-fill if frequency actually changed (not on initial mount)
    if (prevFrequency !== null && prevFrequency !== formData.serviceFrequency) {
      if (formData.serviceFrequency === 'annual') {
        setFormData(prev => ({
          ...prev,
          serviceVisits: {
            oneAnnual: true,
            twoAnnual: false,
          },
        }));
      } else if (formData.serviceFrequency === 'biannual') {
        setFormData(prev => ({
          ...prev,
          serviceVisits: {
            oneAnnual: false,
            twoAnnual: true,
          },
        }));
      }
      // For quarterly, don't auto-fill - let user select manually
    }
    setPrevFrequency(formData.serviceFrequency);
  }, [formData.serviceFrequency, prevFrequency]);

  // Helper functions for checkbox handling
  const toggleServiceVisit = (type: 'oneAnnual' | 'twoAnnual') => {
    setFormData({
      ...formData,
      serviceVisits: {
        ...formData.serviceVisits,
        [type]: !formData.serviceVisits[type],
      },
    });
  };

  const toggleStandardService = (serviceKey: string) => {
    const isSelected = formData.standardServices.includes(serviceKey);
    setFormData({
      ...formData,
      standardServices: isSelected
        ? formData.standardServices.filter(s => s !== serviceKey)
        : [...formData.standardServices, serviceKey],
    });
  };

  const toggleAddon = (category: 'skylights' | 'solar' | 'steel' | 'sedum', addonKey: string) => {
    const currentAddons = formData.addons[category] || [];
    const isSelected = currentAddons.includes(addonKey);
    setFormData({
      ...formData,
      addons: {
        ...formData.addons,
        [category]: isSelected
          ? currentAddons.filter(a => a !== addonKey)
          : [...currentAddons, addonKey],
      },
    });
  };

  const handleSignatureImageUpload = async (type: 'supplier' | 'customer', file: File) => {
    if (!currentUser || !formData.customerId) return;

    setUploadingSignature(prev => ({ ...prev, [type]: true }));
    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Create storage reference for signature images
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../../config/firebase');
      const timestamp = Date.now();
      const fileName = `signature_${type}_${timestamp}_${compressedFile.name}`;
      const storagePath = `service-agreements/${formData.customerId}/signatures/${fileName}`;
      const fileRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      const snapshot = await uploadBytes(fileRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update form data
      setFormData({
        ...formData,
        signatures: {
          ...formData.signatures,
          [`${type}ImageUrl`]: downloadURL,
        },
      });
    } catch (error) {
      console.error(`Error uploading ${type} signature:`, error);
      showError(t('common.errorOccurred') || 'Failed to upload signature image');
    } finally {
      setUploadingSignature(prev => ({ ...prev, [type]: false }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = t('serviceAgreement.validation.customerRequired');
    }
    if (!formData.startDate) {
      newErrors.startDate = t('serviceAgreement.validation.startDateRequired');
    }
    if (!formData.endDate) {
      newErrors.endDate = t('serviceAgreement.validation.endDateRequired');
    }
    if (!formData.nextServiceDate) {
      newErrors.nextServiceDate = t('serviceAgreement.validation.nextServiceDateRequired');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = t('serviceAgreement.validation.endDateAfterStart');
      }
    }

    if (formData.startDate && formData.endDate && formData.nextServiceDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const next = new Date(formData.nextServiceDate);
      if (next < start || next > end) {
        newErrors.nextServiceDate = t('serviceAgreement.validation.nextServiceDateValid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      if (!selectedCustomer || !currentUser) {
        throw new Error('Customer or user not found');
      }

      const agreementData = {
        customerId: formData.customerId,
        customerName: selectedCustomer.name,
        customerAddress: selectedCustomer.address || '',
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        branchId: currentUser.branchId || '',
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        agreementType: formData.agreementType,
        title: '', // Keep for backwards compatibility but always empty
        description: undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        nextServiceDate: new Date(formData.nextServiceDate).toISOString(),
        serviceFrequency: formData.serviceFrequency,
        status: formData.status,
        notes: formData.notes || undefined,
        // Paper version fields - always use default purpose text
        purpose:
          t('serviceAgreement.form.purpose.text') ||
          'Løbende service og vedligehold af taget for at sikre funktion, tæthed og lang levetid. Aftalen omfatter både udbedring af begyndende skader, forebyggende kontrol samt dokumentation til brug for drift og eventuel garantisikring.',
        serviceVisits:
          formData.serviceVisits.oneAnnual || formData.serviceVisits.twoAnnual
            ? formData.serviceVisits
            : undefined,
        standardServices:
          formData.standardServices.length > 0 ? formData.standardServices : undefined,
        addons:
          formData.addons.skylights?.length ||
          formData.addons.solar?.length ||
          formData.addons.steel?.length ||
          formData.addons.sedum?.length
            ? formData.addons
            : undefined,
        pricingStructure:
          formData.pricingStructure.perRoof || formData.pricingStructure.perSquareMeter
            ? {
                perRoof:
                  formData.pricingStructure.perRoof && formData.pricingStructure.perRoof !== '0'
                    ? parseFloat(formData.pricingStructure.perRoof)
                    : undefined,
                perSquareMeter:
                  formData.pricingStructure.perSquareMeter &&
                  formData.pricingStructure.perSquareMeter !== '0'
                    ? parseFloat(formData.pricingStructure.perSquareMeter)
                    : undefined,
              }
            : undefined,
        billingFrequency: formData.billingFrequency,
        signatures:
          formData.signatures.supplier ||
          formData.signatures.customer ||
          formData.signatures.supplierImageUrl ||
          formData.signatures.customerImageUrl
            ? {
                supplier: formData.signatures.supplier || undefined,
                customer: formData.signatures.customer || undefined,
                supplierImageUrl: formData.signatures.supplierImageUrl || undefined,
                customerImageUrl: formData.signatures.customerImageUrl || undefined,
              }
            : undefined,
      };

      if (mode === 'create') {
        await createServiceAgreement(agreementData);
        showSuccess(t('serviceAgreement.created'));
      } else if (agreement) {
        await updateServiceAgreement(agreement.id, agreementData);
        showSuccess(t('serviceAgreement.updated'));
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving service agreement:', error);
      showError(t('common.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200'>
        <div className='sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between z-10'>
          <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
            {mode === 'create'
              ? t('serviceAgreement.form.create')
              : t('serviceAgreement.form.update')}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg'
            aria-label={t('common.buttons.close')}
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-8 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('serviceAgreement.form.customer')} *
            </label>
            {loadingCustomers ? (
              <div className='w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2'></div>
                <span className='text-sm text-slate-600'>
                  {t('serviceAgreement.form.loadingCustomers') || 'Loading customers...'}
                </span>
              </div>
            ) : customerError === 'fetchError' ? (
              <div className='w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <AlertCircle className='h-4 w-4 text-red-600 mr-2' />
                    <span className='text-sm text-red-600'>
                      {t('serviceAgreement.form.customerError') || 'Failed to load customers'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={fetchCustomers}
                    className='text-red-600 hover:text-red-800 transition-colors'
                    title={t('serviceAgreement.form.retry') || 'Retry'}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ) : customerError === 'noCustomers' && mode === 'create' ? (
              <div className='w-full px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <AlertCircle className='h-4 w-4 text-yellow-600 mr-2' />
                    <span className='text-sm text-yellow-600'>
                      {t('serviceAgreement.form.noCustomers') ||
                        'No customers found. Please create a customer first.'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={fetchCustomers}
                    className='text-yellow-600 hover:text-yellow-800 transition-colors'
                    title={t('serviceAgreement.form.refresh') || 'Refresh'}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
                disabled={mode === 'edit'}
              >
                <option value=''>{t('serviceAgreement.form.customerPlaceholder')}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company ? `${customer.company} - ${customer.name}` : customer.name}{' '}
                    {customer.address ? `- ${customer.address}` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.customerId && <p className='text-red-600 text-sm mt-1'>{errors.customerId}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('serviceAgreement.form.agreementType')}
            </label>
            <select
              value={formData.agreementType}
              onChange={e => setFormData({ ...formData, agreementType: e.target.value as any })}
              className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
            >
              <option value='maintenance'>{t('serviceAgreement.type.maintenance')}</option>
              <option value='other'>{t('serviceAgreement.type.other')}</option>
            </select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('serviceAgreement.form.startDate')} *
              </label>
              <DateInput
                id='startDate'
                value={formData.startDate}
                onChange={value => setFormData({ ...formData, startDate: value })}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
                required
              />
              {errors.startDate && <p className='text-red-600 text-sm mt-1'>{errors.startDate}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('serviceAgreement.form.endDate')} *
              </label>
              <DateInput
                id='endDate'
                value={formData.endDate}
                onChange={value => setFormData({ ...formData, endDate: value })}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
                required
              />
              {errors.endDate && <p className='text-red-600 text-sm mt-1'>{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('serviceAgreement.form.nextServiceDate')} *
            </label>
            <DateInput
              id='nextServiceDate'
              value={formData.nextServiceDate}
              onChange={value => setFormData({ ...formData, nextServiceDate: value })}
              className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
              required
            />
            {errors.nextServiceDate && (
              <p className='text-red-600 text-sm mt-1'>{errors.nextServiceDate}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('serviceAgreement.form.serviceFrequency')}
            </label>
            <select
              value={formData.serviceFrequency}
              onChange={e => setFormData({ ...formData, serviceFrequency: e.target.value as any })}
              className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
            >
              <option value='quarterly'>{t('serviceAgreement.frequency.quarterly')}</option>
              <option value='biannual'>{t('serviceAgreement.frequency.biannual')}</option>
              <option value='annual'>{t('serviceAgreement.frequency.annual')}</option>
            </select>
          </div>

          {/* Paper Version Fields */}

          {/* 1. AFTALENS FORMÅL */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.purpose.title') || '1. AFTALENS FORMÅL'}
            </h3>
            <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
              <p className='text-slate-700 whitespace-pre-wrap'>
                {t('serviceAgreement.form.purpose.text') ||
                  'Løbende service og vedligehold af taget for at sikre funktion, tæthed og lang levetid. Aftalen omfatter både udbedring af begyndende skader, forebyggende kontrol samt dokumentation til brug for drift og eventuel garantisikring.'}
              </p>
            </div>
          </div>

          {/* 2. YDELSER – AFKRYDSNING */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.services.title') || '2. YDELSER – AFKRYDSNING'}
            </h3>

            {/* SERVICEBESØG */}
            <div className='mb-6'>
              <h4 className='text-md font-medium text-slate-800 mb-3'>
                {t('serviceAgreement.form.services.serviceVisits') || 'SERVICEBESØG:'}
              </h4>
              <div className='space-y-2'>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.serviceVisits.oneAnnual}
                    onChange={() => toggleServiceVisit('oneAnnual')}
                    className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                  />
                  <span className='text-sm text-slate-700'>
                    {t('serviceAgreement.form.services.oneAnnual') || '1 årligt servicebesøg'}
                  </span>
                </label>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.serviceVisits.twoAnnual}
                    onChange={() => toggleServiceVisit('twoAnnual')}
                    className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                  />
                  <span className='text-sm text-slate-700'>
                    {t('serviceAgreement.form.services.twoAnnual') || '2 årlige servicebesøg'}
                  </span>
                </label>
              </div>
            </div>

            {/* STANDARDYDELSER */}
            <div>
              <h4 className='text-md font-medium text-slate-800 mb-3'>
                {t('serviceAgreement.form.services.standardServices') || 'STANDARDYDELSER:'}
              </h4>
              <div className='space-y-2'>
                {[
                  {
                    key: 'visualInspection',
                    label:
                      t('serviceAgreement.form.services.visualInspection') ||
                      'Visuel gennemgang af tag',
                  },
                  {
                    key: 'roofingControl',
                    label:
                      t('serviceAgreement.form.services.roofingControl') ||
                      'Kontrol af tagpap og samlinger',
                  },
                  {
                    key: 'penetrationsControl',
                    label:
                      t('serviceAgreement.form.services.penetrationsControl') ||
                      'Kontrol af gennemføringer',
                  },
                  {
                    key: 'flashingControl',
                    label:
                      t('serviceAgreement.form.services.flashingControl') ||
                      'Kontrol af inddækninger og fuger',
                  },
                  {
                    key: 'drainCleaning',
                    label:
                      t('serviceAgreement.form.services.drainCleaning') ||
                      'Rensning af afløb og skotrender',
                  },
                  {
                    key: 'gutterCleaning',
                    label:
                      t('serviceAgreement.form.services.gutterCleaning') ||
                      'Rengøring af tagrender',
                  },
                  {
                    key: 'debrisRemoval',
                    label:
                      t('serviceAgreement.form.services.debrisRemoval') ||
                      'Fjernelse af blade, mos og snavs',
                  },
                  {
                    key: 'drainageTest',
                    label:
                      t('serviceAgreement.form.services.drainageTest') ||
                      'Funktions-/flow-test af afvanding',
                  },
                  {
                    key: 'walkwayControl',
                    label:
                      t('serviceAgreement.form.services.walkwayControl') || 'Kontrol af gangbaner',
                  },
                  {
                    key: 'photoDocumentation',
                    label:
                      t('serviceAgreement.form.services.photoDocumentation') || 'Fotodokumentation',
                  },
                ].map(service => (
                  <label key={service.key} className='flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.standardServices.includes(service.key)}
                      onChange={() => toggleStandardService(service.key)}
                      className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                    />
                    <span className='text-sm text-slate-700'>{service.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 3. TILLÆG (VALGFRIE YDELSER) */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.addons.title') || '3. TILLÆG (VALGFRIE YDELSER)'}
            </h3>

            {/* OVENLYS & FALDSIKRING */}
            <div className='mb-4'>
              <button
                type='button'
                onClick={() =>
                  setExpandedAddons({ ...expandedAddons, skylights: !expandedAddons.skylights })
                }
                className='w-full flex items-center justify-between text-md font-medium text-slate-800 mb-2 p-2 hover:bg-slate-50 rounded-lg'
              >
                <span>
                  {t('serviceAgreement.form.addons.skylights.title') || 'OVENLYS & FALDSIKRING:'}
                </span>
                {expandedAddons.skylights ? (
                  <ChevronUp className='w-5 h-5' />
                ) : (
                  <ChevronDown className='w-5 h-5' />
                )}
              </button>
              {expandedAddons.skylights && (
                <div className='space-y-2 pl-4'>
                  {[
                    {
                      key: 'skylightCleaning',
                      label:
                        t('serviceAgreement.form.addons.skylightCleaning') ||
                        'Rensning/inspektion af ovenlyskupler',
                    },
                    {
                      key: 'annualInspection',
                      label:
                        t('serviceAgreement.form.addons.annualInspection') ||
                        'Årligt eftersyn (EN 365)',
                      tooltip:
                        t('serviceAgreement.form.addons.en365Tooltip') ||
                        'EN 365 er en europæisk standard for personlig værnemiddel mod fald fra højde. Eftersynet sikrer, at udstyret opfylder sikkerhedskravene.',
                    },
                    {
                      key: 'safetyEquipmentControl',
                      label:
                        t('serviceAgreement.form.addons.safetyEquipmentControl') ||
                        'Kontrol af liner, wires, seler og karabiner',
                    },
                  ].map(addon => (
                    <label key={addon.key} className='flex items-center cursor-pointer group'>
                      <input
                        type='checkbox'
                        checked={(formData.addons.skylights || []).includes(addon.key)}
                        onChange={() => toggleAddon('skylights', addon.key)}
                        className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                      />
                      <span className='text-sm text-slate-700 flex items-center'>
                        {addon.label}
                        {addon.tooltip && (
                          <span className='ml-2 relative'>
                            <Info className='w-4 h-4 text-slate-400 group-hover:text-slate-600' />
                            <span className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10'>
                              {addon.tooltip}
                            </span>
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* SOLCELLER */}
            <div className='mb-4'>
              <button
                type='button'
                onClick={() =>
                  setExpandedAddons({ ...expandedAddons, solar: !expandedAddons.solar })
                }
                className='w-full flex items-center justify-between text-md font-medium text-slate-800 mb-2 p-2 hover:bg-slate-50 rounded-lg'
              >
                <span>{t('serviceAgreement.form.addons.solar.title') || 'SOLCELLER:'}</span>
                {expandedAddons.solar ? (
                  <ChevronUp className='w-5 h-5' />
                ) : (
                  <ChevronDown className='w-5 h-5' />
                )}
              </button>
              {expandedAddons.solar && (
                <div className='space-y-2 pl-4'>
                  <label className='flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={(formData.addons.solar || []).includes('solarCleaning')}
                      onChange={() => toggleAddon('solar', 'solarCleaning')}
                      className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                    />
                    <span className='text-sm text-slate-700'>
                      {t('serviceAgreement.form.addons.solarCleaning') || 'Rensning af solceller'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* STÅLTAG */}
            <div className='mb-4'>
              <button
                type='button'
                onClick={() =>
                  setExpandedAddons({ ...expandedAddons, steel: !expandedAddons.steel })
                }
                className='w-full flex items-center justify-between text-md font-medium text-slate-800 mb-2 p-2 hover:bg-slate-50 rounded-lg'
              >
                <span>{t('serviceAgreement.form.addons.steel.title') || 'STÅLTAG:'}</span>
                {expandedAddons.steel ? (
                  <ChevronUp className='w-5 h-5' />
                ) : (
                  <ChevronDown className='w-5 h-5' />
                )}
              </button>
              {expandedAddons.steel && (
                <div className='space-y-2 pl-4'>
                  {[
                    {
                      key: 'mossRemoval',
                      label:
                        t('serviceAgreement.form.addons.mossRemoval') || 'Rensning af lav og mos',
                    },
                    {
                      key: 'chemicalTreatment',
                      label:
                        t('serviceAgreement.form.addons.chemicalTreatment') ||
                        'Kemisk tagbehandling',
                    },
                  ].map(addon => (
                    <label key={addon.key} className='flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={(formData.addons.steel || []).includes(addon.key)}
                        onChange={() => toggleAddon('steel', addon.key)}
                        className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                      />
                      <span className='text-sm text-slate-700'>{addon.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* SEDUMTAG (GRØNT TAG) */}
            <div className='mb-4'>
              <button
                type='button'
                onClick={() =>
                  setExpandedAddons({ ...expandedAddons, sedum: !expandedAddons.sedum })
                }
                className='w-full flex items-center justify-between text-md font-medium text-slate-800 mb-2 p-2 hover:bg-slate-50 rounded-lg'
              >
                <span>
                  {t('serviceAgreement.form.addons.sedum.title') || 'SEDUMTAG (GRØNT TAG):'}
                </span>
                {expandedAddons.sedum ? (
                  <ChevronUp className='w-5 h-5' />
                ) : (
                  <ChevronDown className='w-5 h-5' />
                )}
              </button>
              {expandedAddons.sedum && (
                <div className='space-y-2 pl-4'>
                  {[
                    {
                      key: 'fertilization',
                      label:
                        t('serviceAgreement.form.addons.fertilization') || 'Gødning (forår/sommer)',
                    },
                    {
                      key: 'weedControl',
                      label: t('serviceAgreement.form.addons.weedControl') || 'Ukrudtskontrol',
                    },
                    {
                      key: 'sedumRepair',
                      label:
                        t('serviceAgreement.form.addons.sedumRepair') ||
                        'Reparation af sedumflader',
                    },
                    {
                      key: 'substrateRefill',
                      label:
                        t('serviceAgreement.form.addons.substrateRefill') ||
                        'Efterfyldning af vækstmedie',
                    },
                    {
                      key: 'watering',
                      label: t('serviceAgreement.form.addons.watering') || 'Vanding efter behov',
                    },
                  ].map(addon => (
                    <label key={addon.key} className='flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={(formData.addons.sedum || []).includes(addon.key)}
                        onChange={() => toggleAddon('sedum', addon.key)}
                        className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-3'
                      />
                      <span className='text-sm text-slate-700'>{addon.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. SERVICERAPPORT */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.serviceReport.title') || '4. SERVICERAPPORT'}
            </h3>
            <div className='bg-slate-50 border border-slate-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <Info className='w-5 h-5 text-slate-600 mr-3 mt-0.5' />
                <div className='text-sm text-slate-700'>
                  <p className='font-medium mb-2'>
                    {t('serviceAgreement.form.serviceReport.description') ||
                      'Efter hvert besøg udarbejdes en servicerapport, som indeholder:'}
                  </p>
                  <ul className='list-disc list-inside space-y-1 ml-2'>
                    <li>
                      {t('serviceAgreement.form.serviceReport.photoDocumentation') ||
                        'Fotodokumentation'}
                    </li>
                    <li>
                      {t('serviceAgreement.form.serviceReport.damageDescription') ||
                        'Beskrivelse af eventuelle skader'}
                    </li>
                    <li>
                      {t('serviceAgreement.form.serviceReport.recommendations') ||
                        'Anbefalinger til udbedring og vedligehold'}
                    </li>
                    <li>
                      {t('serviceAgreement.form.serviceReport.annualReport') ||
                        'Årlig tilstandsrapport'}
                    </li>
                    <li>
                      {t('serviceAgreement.form.serviceReport.digitalPlatform') ||
                        'Adgang til digital platform'}
                    </li>
                    <li>
                      {t('serviceAgreement.form.serviceReport.esgReport') ||
                        'ESG-rapport (miljø, social, governance)'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 5. AFTALEPERIODE - Already handled by start/end dates, but add note */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-2'>
              {t('serviceAgreement.form.agreementPeriod.title') || '5. AFTALEPERIODE'}
            </h3>
            <p className='text-sm text-slate-600 mb-4'>
              {t('serviceAgreement.form.agreementPeriod.note') ||
                'Aftalen løber i 12 måneder og forlænges automatisk, medmindre den opsiges.'}
            </p>
          </div>

          {/* 6. PRIS & FAKTURERING */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.pricing.title') || '6. PRIS & FAKTURERING'}
            </h3>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div>
                    <label className='flex items-center mb-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={
                          formData.pricingStructure.perRoof !== '' &&
                          formData.pricingStructure.perRoof !== undefined
                        }
                        onChange={e => {
                          setFormData({
                            ...formData,
                            pricingStructure: {
                              ...formData.pricingStructure,
                              perRoof: e.target.checked ? '0' : '',
                            },
                          });
                        }}
                        className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-2'
                      />
                      <span className='text-sm font-medium text-slate-700'>
                        {t('serviceAgreement.form.pricing.perRoof') || 'Opstarts pris per tag:'}
                      </span>
                    </label>
                    <input
                      type='number'
                      value={
                        formData.pricingStructure.perRoof === '0'
                          ? ''
                          : formData.pricingStructure.perRoof
                      }
                      onChange={e => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          pricingStructure: { ...formData.pricingStructure, perRoof: value },
                        });
                      }}
                      onBlur={e => {
                        // If empty on blur and checkbox is checked, set to empty string (not '0')
                        if (!e.target.value && formData.pricingStructure.perRoof !== '') {
                          setFormData({
                            ...formData,
                            pricingStructure: { ...formData.pricingStructure, perRoof: '' },
                          });
                        }
                      }}
                      placeholder='DKK'
                      className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed'
                      min={0}
                      step={0.01}
                      disabled={
                        formData.pricingStructure.perRoof === '' ||
                        formData.pricingStructure.perRoof === undefined
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className='flex items-center mb-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={
                        formData.pricingStructure.perSquareMeter !== '' &&
                        formData.pricingStructure.perSquareMeter !== undefined
                      }
                      onChange={e => {
                        setFormData({
                          ...formData,
                          pricingStructure: {
                            ...formData.pricingStructure,
                            perSquareMeter: e.target.checked ? '0' : '',
                          },
                        });
                      }}
                      className='w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-slate-700 mr-2'
                    />
                    <span className='text-sm font-medium text-slate-700'>
                      {t('serviceAgreement.form.pricing.perSquareMeter') || 'Pris pr. år per m²:'}
                    </span>
                  </label>
                  <input
                    type='number'
                    value={
                      formData.pricingStructure.perSquareMeter === '0'
                        ? ''
                        : formData.pricingStructure.perSquareMeter
                    }
                    onChange={e => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        pricingStructure: { ...formData.pricingStructure, perSquareMeter: value },
                      });
                    }}
                    onBlur={e => {
                      // If empty on blur and checkbox is checked, set to empty string (not '0')
                      if (!e.target.value && formData.pricingStructure.perSquareMeter !== '') {
                        setFormData({
                          ...formData,
                          pricingStructure: { ...formData.pricingStructure, perSquareMeter: '' },
                        });
                      }
                    }}
                    placeholder='DKK'
                    className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed'
                    min={0}
                    step={0.01}
                    disabled={
                      formData.pricingStructure.perSquareMeter === '' ||
                      formData.pricingStructure.perSquareMeter === undefined
                    }
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('serviceAgreement.form.pricing.billingFrequency') || 'Faktureringsfrekvens:'}
                </label>
                <div className='flex gap-4'>
                  <label className='flex items-center cursor-pointer'>
                    <input
                      type='radio'
                      name='billingFrequency'
                      value='annual'
                      checked={formData.billingFrequency === 'annual'}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          billingFrequency: e.target.value as 'annual' | 'semi-annual',
                        })
                      }
                      className='w-5 h-5 text-slate-700 border-slate-300 focus:ring-slate-700 mr-2'
                    />
                    <span className='text-sm text-slate-700'>
                      {t('serviceAgreement.form.pricing.annual') || 'Årlig betaling'}
                    </span>
                  </label>
                  <label className='flex items-center cursor-pointer'>
                    <input
                      type='radio'
                      name='billingFrequency'
                      value='semi-annual'
                      checked={formData.billingFrequency === 'semi-annual'}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          billingFrequency: e.target.value as 'annual' | 'semi-annual',
                        })
                      }
                      className='w-5 h-5 text-slate-700 border-slate-300 focus:ring-slate-700 mr-2'
                    />
                    <span className='text-sm text-slate-700'>
                      {t('serviceAgreement.form.pricing.semiAnnual') || 'Halvårlig betaling'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 7. UNDERSKRIFTER */}
          <div className='border-t border-slate-200 pt-6'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              {t('serviceAgreement.form.signatures.title') || '7. UNDERSKRIFTER'}
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('serviceAgreement.form.signatures.supplier') || 'Leverandør:'}
                </label>
                <input
                  type='text'
                  value={formData.signatures.supplier}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      signatures: { ...formData.signatures, supplier: e.target.value },
                    })
                  }
                  placeholder={t('serviceAgreement.form.signatures.supplierPlaceholder') || 'Navn'}
                  className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent mb-2'
                />
                <input
                  ref={supplierImageInputRef}
                  type='file'
                  accept='image/*'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSignatureImageUpload('supplier', file);
                    }
                  }}
                  className='hidden'
                />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => supplierImageInputRef.current?.click()}
                    disabled={uploadingSignature.supplier}
                    className='px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {uploadingSignature.supplier ? (
                      <>
                        <RefreshCw className='w-4 h-4 animate-spin' />
                        {t('common.uploading') || 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <Upload className='w-4 h-4' />
                        {t('serviceAgreement.form.signatures.uploadImage') || 'Upload billede'}
                      </>
                    )}
                  </button>
                  {formData.signatures.supplierImageUrl && (
                    <div className='relative inline-block'>
                      <img
                        src={formData.signatures.supplierImageUrl}
                        alt='Supplier signature'
                        className='h-12 w-auto border border-slate-300 rounded'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            signatures: { ...formData.signatures, supplierImageUrl: '' },
                          })
                        }
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                      >
                        <XIcon className='w-3 h-3' />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('serviceAgreement.form.signatures.customer') || 'Kunde:'}
                </label>
                <input
                  type='text'
                  value={formData.signatures.customer}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      signatures: { ...formData.signatures, customer: e.target.value },
                    })
                  }
                  placeholder={t('serviceAgreement.form.signatures.customerPlaceholder') || 'Navn'}
                  className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent mb-2'
                />
                <input
                  ref={customerImageInputRef}
                  type='file'
                  accept='image/*'
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSignatureImageUpload('customer', file);
                    }
                  }}
                  className='hidden'
                />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => customerImageInputRef.current?.click()}
                    disabled={uploadingSignature.customer}
                    className='px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {uploadingSignature.customer ? (
                      <>
                        <RefreshCw className='w-4 h-4 animate-spin' />
                        {t('common.uploading') || 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <Upload className='w-4 h-4' />
                        {t('serviceAgreement.form.signatures.uploadImage') || 'Upload billede'}
                      </>
                    )}
                  </button>
                  {formData.signatures.customerImageUrl && (
                    <div className='relative inline-block'>
                      <img
                        src={formData.signatures.customerImageUrl}
                        alt='Customer signature'
                        className='h-12 w-auto border border-slate-300 rounded'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setFormData({
                            ...formData,
                            signatures: { ...formData.signatures, customerImageUrl: '' },
                          })
                        }
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                      >
                        <XIcon className='w-3 h-3' />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              {t('serviceAgreement.form.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('serviceAgreement.form.notesPlaceholder')}
              rows={3}
              className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent'
            />
          </div>

          <div className='flex justify-end gap-3 pt-6 border-t border-slate-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium'
            >
              {t('serviceAgreement.form.cancel')}
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium uppercase tracking-wide shadow-sm hover:shadow-md'
            >
              {loading ? t('serviceAgreement.form.saving') : t('serviceAgreement.form.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceAgreementForm;
