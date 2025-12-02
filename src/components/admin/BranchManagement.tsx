import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import * as branchService from '../../services/branchService';
import * as branchLogoService from '../../services/branchLogoService';
import * as userService from '../../services/userService';
import { Branch, Employee } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

const BranchManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    cvrNumber: '',
    vatNumber: '',
    businessType: 'roofing',
    industryCode: '43910',
    website: '',
    description: '',
    isActive: true,
    country: 'Denmark',
    region: '',
    municipality: '',
    postalCode: '',
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has permission to manage branches
  if (!currentUser || currentUser.role !== 'superadmin' || currentUser.permissionLevel < 2) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center'>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>Access Denied</h1>
          <p className='text-slate-600 mb-6'>You don't have permission to manage branches.</p>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm'
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // CVR validation function
  const validateCVRNumber = (cvr: string): boolean => {
    // Danish CVR numbers are 8 digits
    const cvrRegex = /^\d{8}$/;
    if (!cvrRegex.test(cvr)) return false;

    // Modulus 11 check
    const digits = cvr.split('').map(Number);
    let sum = 0;
    const weights = [2, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 7; i++) {
      sum += digits[i] * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;

    return checkDigit === digits[7];
  };

  // Form validation functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name is required
    if (!formData.name?.trim()) {
      errors.name = t('admin.validation.branchNameRequired');
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Branch name must be at least 2 characters';
    }

    // Address is required
    if (!formData.address?.trim()) {
      errors.address = t('admin.validation.branchAddressRequired');
    } else if (formData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    // CVR validation (if provided)
    if (formData.cvrNumber && !validateCVRNumber(formData.cvrNumber)) {
      errors.cvrNumber = 'Please enter a valid Danish CVR number (8 digits)';
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('form.validation.emailInvalid');
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = t('form.validation.phoneInvalid');
    }

    // Website validation (if provided)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Please enter a valid website URL (starting with http:// or https://)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedBranch?.id) {
      setError('Please select a branch first');
      return;
    }

    setLogoUploading(true);
    setLogoUploadProgress(0);

    try {
      const result = await branchLogoService.uploadBranchLogo(file, selectedBranch.id, progress =>
        setLogoUploadProgress(progress)
      );

      // Update the branch with new logo URL
      await branchService.updateBranch(selectedBranch.id, { logoUrl: result.url });

      // Update local state
      setBranches(prev =>
        prev.map(branch =>
          branch.id === selectedBranch.id ? { ...branch, logoUrl: result.url } : branch
        )
      );

      setSelectedBranch(prev => (prev ? { ...prev, logoUrl: result.url } : null));
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
      setLogoUploadProgress(0);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadBranchEmployees(selectedBranch.id);
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const branchesData = await branchService.getBranches(currentUser || undefined);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const loadBranchEmployees = async (branchId: string) => {
    try {
      // Use userService.getUsers() instead of getBranchEmployees() 
      // because employees are stored in /users collection, not in subcollections
      const employeesData = await userService.getUsers(branchId);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError(t('admin.errors.failedToLoadEmployees'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, formData);
        setBranches(prev => prev.map(b => (b.id === editingBranch.id ? { ...b, ...formData } : b)));
      } else {
        const newBranch = await branchService.createBranch({
          ...formData,
          createdAt: new Date().toISOString(),
        } as Omit<Branch, 'id'>);

        setBranches(prev => [...prev, { id: newBranch, ...formData } as Branch]);
      }

      setShowForm(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
      setError('');
      clearFormErrors();
    } catch (error) {
      console.error('Error saving branch:', error);
      setError(t('admin.errors.failedToSaveBranch'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
    });
    clearFormErrors();
    setShowForm(true);
  };

  const handleDelete = async (branchId: string) => {
    if (
      !window.confirm(t('common.deleteBranchConfirmation'))
    ) {
      return;
    }

    try {
      setLoading(true);
      await branchService.deleteBranch(branchId);
      setBranches(prev => prev.filter(b => b.id !== branchId));
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      setError('Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
    setError('');
    clearFormErrors();
  };

  if (loading && branches.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 flex items-center'>
                <Building className='w-8 h-8 mr-3 text-slate-700' />
                {t('admin.branchManagement.title')}
              </h1>
              <p className='text-slate-600 mt-2'>{t('admin.branchManagement.subtitle')}</p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors'
            >
              <Plus className='w-5 h-5 mr-2' />
              {t('admin.branchManagement.addBranch')}
            </button>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm'>
          <div className='flex'>
            <AlertTriangle className='w-5 h-5 text-red-400' />
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Branch Form */}
      {showForm && (
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4'>
            {editingBranch
              ? t('admin.branchManagement.editBranch')
              : t('admin.branchManagement.addNewBranch')}
          </h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-slate-700'>
                  {t('admin.branchManagement.branchName')} *
                </label>
                <input
                  type='text'
                  id='name'
                  required
                  value={formData.name || ''}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) {
                      clearFormErrors();
                    }
                  }}
                  className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-2 ${
                    formErrors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                  }`}
                  placeholder={t('admin.branchManagement.branchNamePlaceholder')}
                />
                {formErrors.name && <p className='mt-1 text-sm text-red-600'>{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor='phone' className='block text-sm font-medium text-slate-700'>
                  {t('admin.branchManagement.phoneNumber')}
                </label>
                <input
                  type='tel'
                  id='phone'
                  value={formData.phone || ''}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className='mt-1 block w-full px-4 py-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('admin.branchManagement.phonePlaceholder')}
                />
              </div>

              <div className='md:col-span-2'>
                <label htmlFor='address' className='block text-sm font-medium text-slate-700'>
                  {t('admin.branchManagement.address')} *
                </label>
                <input
                  type='text'
                  id='address'
                  required
                  value={formData.address || ''}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, address: e.target.value }));
                    if (formErrors.address) {
                      clearFormErrors();
                    }
                  }}
                  className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-2 ${
                    formErrors.address
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                  }`}
                  placeholder={t('admin.branchManagement.addressPlaceholder')}
                />
                {formErrors.address && (
                  <p className='mt-1 text-sm text-red-600'>{formErrors.address}</p>
                )}
              </div>

              <div className='md:col-span-2'>
                <label htmlFor='email' className='block text-sm font-medium text-slate-700'>
                  {t('admin.branchManagement.emailAddress')}
                </label>
                <input
                  type='email'
                  id='email'
                  value={formData.email || ''}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className='mt-1 block w-full px-4 py-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('admin.branchManagement.emailPlaceholder')}
                />
              </div>
            </div>

            <div className='flex justify-end space-x-3'>
              <button
                type='button'
                onClick={handleCancel}
                className='px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
              >
                {t('form.buttons.cancel')}
              </button>

              <button
                type='submit'
                disabled={isSubmitting}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 shadow-sm'
              >
                {isSubmitting ? (
                  <LoadingSpinner size='sm' />
                ) : (
                  <CheckCircle className='w-4 h-4 mr-2' />
                )}
                {isSubmitting
                  ? editingBranch
                    ? t('admin.branchManagement.updating')
                    : t('admin.branchManagement.creating')
                  : editingBranch
                    ? t('admin.branchManagement.updateBranch')
                    : t('admin.branchManagement.createBranch')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Branches List */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='px-6 py-4 border-b border-slate-200'>
            <h2 className='text-lg font-semibold text-slate-900'>Branches ({branches.length})</h2>
          </div>

          {branches.length === 0 ? (
            <div className='p-6 text-center'>
              <Building className='w-12 h-12 text-slate-400 mx-auto' />
              <h3 className='mt-2 text-sm font-semibold text-slate-900'>No branches yet</h3>
              <p className='mt-1 text-sm text-slate-500'>
                Get started by creating your first branch.
              </p>
            </div>
          ) : (
            <div className='divide-y divide-slate-200'>
              {branches.map(branch => (
                <div
                  key={branch.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedBranch?.id === branch.id ? 'bg-slate-100 border-l-4 border-slate-700' : ''
                  }`}
                  onClick={() => setSelectedBranch(branch)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-semibold text-slate-900 truncate'>{branch.name}</h3>
                      <p className='text-sm text-slate-600 truncate'>{branch.address}</p>
                      <div className='flex items-center mt-1 space-x-4'>
                        {branch.phone && (
                          <div className='flex items-center text-xs text-slate-500'>
                            <Phone className='w-3 h-3 mr-1' />
                            {branch.phone}
                          </div>
                        )}
                        {branch.email && (
                          <div className='flex items-center text-xs text-slate-500'>
                            <Mail className='w-3 h-3 mr-1' />
                            {branch.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(branch);
                        }}
                        className='text-slate-700 hover:text-slate-900 transition-colors'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(branch.id);
                        }}
                        className='text-red-600 hover:text-red-800 transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Branch Details */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='px-6 py-4 border-b border-slate-200'>
            <h2 className='text-lg font-semibold text-slate-900'>
              {selectedBranch ? `${selectedBranch.name} - Employees` : 'Select a Branch'}
            </h2>
          </div>

          {!selectedBranch ? (
            <div className='p-6 text-center'>
              <Users className='w-12 h-12 text-slate-400 mx-auto' />
              <h3 className='mt-2 text-sm font-semibold text-slate-900'>No branch selected</h3>
              <p className='mt-1 text-sm text-slate-500'>Select a branch to view its employees.</p>
            </div>
          ) : (
            <div className='p-6'>
              <div className='mb-4'>
                <h3 className='text-sm font-semibold text-slate-900 mb-2'>Branch Information</h3>

                {/* Branch Logo */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Branch Logo
                  </label>
                  <div className='flex items-center space-x-4'>
                    {selectedBranch.logoUrl ? (
                      <div className='relative'>
                        <img
                          src={selectedBranch.logoUrl}
                          alt={`${selectedBranch.name} logo`}
                          className='w-16 h-16 object-cover rounded-lg border border-slate-300'
                        />
                        <button
                          onClick={async () => {
                            if (!selectedBranch?.id) return;

                            try {
                              // Delete logo from database
                              await branchService.updateBranch(selectedBranch.id, { logoUrl: '' });

                              // Update local state
                              setBranches(prev =>
                                prev.map(branch =>
                                  branch.id === selectedBranch.id
                                    ? { ...branch, logoUrl: '' }
                                    : branch
                                )
                              );
                              setSelectedBranch(prev => (prev ? { ...prev, logoUrl: '' } : null));
                            } catch (error) {
                              console.error('Error deleting logo:', error);
                              setError('Failed to delete logo');
                            }
                          }}
                          className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ) : (
                      <div className='w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center'>
                        <Building className='w-8 h-8 text-slate-400' />
                      </div>
                    )}

                    <div className='flex-1'>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className='hidden'
                        id='logo-upload'
                      />
                      <label
                        htmlFor='logo-upload'
                        className={`inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer ${
                          logoUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {logoUploading ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Uploading... {logoUploadProgress}%
                          </>
                        ) : (
                          <>
                            <Plus className='w-4 h-4 mr-2' />
                            {selectedBranch.logoUrl ? 'Change Logo' : 'Upload Logo'}
                          </>
                        )}
                      </label>
                      <p className='text-xs text-slate-500 mt-1'>PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div className='space-y-2 text-sm text-slate-600'>
                  <div className='flex items-center'>
                    <MapPin className='w-4 h-4 mr-2' />
                    {selectedBranch.address}
                  </div>
                  {selectedBranch.phone && (
                    <div className='flex items-center'>
                      <Phone className='w-4 h-4 mr-2' />
                      {selectedBranch.phone}
                    </div>
                  )}
                  {selectedBranch.email && (
                    <div className='flex items-center'>
                      <Mail className='w-4 h-4 mr-2' />
                      {selectedBranch.email}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className='text-sm font-semibold text-slate-900 mb-2'>
                  Employees ({employees.length})
                </h3>
                {employees.length === 0 ? (
                  <p className='text-sm text-slate-500'>No employees assigned to this branch yet.</p>
                ) : (
                  <div className='space-y-2'>
                    {employees.map(employee => (
                      <div
                        key={employee.id}
                        className='flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200'
                      >
                        <div>
                          <p className='text-sm font-semibold text-slate-900'>
                            {employee.displayName}
                          </p>
                          <p className='text-xs text-slate-500'>{employee.email}</p>
                        </div>
                        <span className='text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded-full capitalize font-medium'>
                          {employee.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default BranchManagement;
