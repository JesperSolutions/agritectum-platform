import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { Customer } from '../../types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  FileText,
  AlertTriangle,
  XCircle,
  FilePlus,
  Link2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import Tooltip from '../Tooltip';
import ConfirmationDialog from '../common/ConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { logger } from '../../utils/logger';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../services/customerService';
import { formatCurrencyAmount } from '../../utils/currency';
import type { SupportedLocale } from '../../utils/geolocation';
import {
  createCustomerInvitation,
  getSignupUrl,
  getInvitationsForCustomer,
  CustomerInvitation,
} from '../../services/customerInvitationService';

interface CustomerManagementProps {}

const CustomerManagement: React.FC<CustomerManagementProps> = () => {
  const navigate = useNavigate();
  const { currentUser, refreshToken, firebaseUser } = useAuth();
  const { t, locale } = useIntl();
  const { showSuccess, showError } = useToast();
  const currentLocale = locale as SupportedLocale;

  // Determine if user is in read-only mode (inspectors)
  const isReadOnly = currentUser?.role === 'inspector';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'all' | 'hasReports' | 'noReports'>('all');
  const [filterMinRevenue, setFilterMinRevenue] = useState<number | undefined>(undefined);
  const [filterParentCompany, setFilterParentCompany] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Invitation state
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationCustomer, setInvitationCustomer] = useState<Customer | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [customerInvitations, setCustomerInvitations] = useState<CustomerInvitation[]>([]);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    customerType: 'company' as 'individual' | 'company',
    buildingAddress: '',
    parentCompanyId: '' as string | undefined,
    notes: '',
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form validation functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name is required
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Customer name must be at least 2 characters';
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  // Fetch customers
  const fetchCustomers = async () => {
    if (!currentUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Super admins see all customers, branch admins see only their branch customers
      const branchId = currentUser.role === 'superadmin' ? undefined : currentUser.branchId;
      const customersData = await getCustomers(branchId);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      const errorMessage = error instanceof Error ? error.message : t('customer.errorMessage');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'branchAdmin')) {
      fetchCustomers();
    }
  }, [currentUser]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = customers.filter(customer => {
      // Search filter
      const matchesSearch =
        debouncedSearchTerm === '' ||
        customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.phone
          ?.replace(/\s|-|\(|\)/g, '')
          .toLowerCase()
          .includes(debouncedSearchTerm.replace(/\s|-|\(|\)/g, '').toLowerCase()) ||
        customer.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Parent company filter
      const matchesParentCompany =
        filterParentCompany === null ||
        customer.parentCompanyId === filterParentCompany ||
        (filterParentCompany === 'none' &&
          !customer.parentCompanyId &&
          customer.customerType === 'company');

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'hasReports' && (customer.totalReports || 0) > 0) ||
        (filterStatus === 'noReports' && (customer.totalReports || 0) === 0);

      // Revenue filter
      const matchesRevenue =
        filterMinRevenue === undefined || (customer.totalRevenue || 0) >= filterMinRevenue;

      return matchesSearch && matchesStatus && matchesRevenue && matchesParentCompany;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'totalRevenue':
          aValue = a.totalRevenue || 0;
          bValue = b.totalRevenue || 0;
          break;
        case 'totalReports':
          aValue = a.totalReports || 0;
          bValue = b.totalReports || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [
    customers,
    debouncedSearchTerm,
    sortBy,
    sortOrder,
    filterStatus,
    filterMinRevenue,
    filterParentCompany,
  ]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterMinRevenue !== undefined && filterMinRevenue > 0) count++;
    if (filterParentCompany !== null) count++;
    return count;
  }, [filterStatus, filterMinRevenue, filterParentCompany]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMinRevenue(undefined);
    setFilterParentCompany(null);
  };

  const applyQuickFilter = (preset: 'hasReports' | 'noReports' | 'highValue') => {
    setFilterStatus(
      preset === 'hasReports' ? 'hasReports' : preset === 'noReports' ? 'noReports' : 'all'
    );
    if (preset === 'highValue') {
      setFilterMinRevenue(50000); // 50k threshold (currency varies by locale)
    } else {
      setFilterMinRevenue(undefined);
    }
  };

  // Handle customer actions
  const handleViewCustomer = (customer: Customer) => {
    navigate(`/admin/customers/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      customerType: customer.customerType || 'company',
      buildingAddress: customer.buildingAddress || '',
      parentCompanyId: customer.parentCompanyId || undefined,
      notes: customer.notes || '',
    });
    clearFormErrors();
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // Check if customer has reports and show warning using ConfirmationDialog instead of browser confirm
    if (customer.totalReports && customer.totalReports > 0) {
      // Show warning in the delete modal instead of browser confirm
      // The confirmation dialog will show the proper message
    }
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleCreateCustomer = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      customerType: 'company',
      buildingAddress: '',
      parentCompanyId: undefined,
      notes: '',
    });
    clearFormErrors();
    setShowCreateModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (customerToDelete) {
      setIsDeleting(true);
      try {
        // Force refresh token to ensure we have latest claims
        if (currentUser && refreshToken) {
          await refreshToken();
        }

        // Log current user info for debugging - EXPANDED (only in development)
        logger.debug('Pre-delete User Info - FULL DETAILS:');
        logger.debug('   User ID:', currentUser?.uid);
        logger.debug('   User Email:', currentUser?.email);
        logger.debug('   User Role:', currentUser?.role);
        logger.debug('   User Permission Level:', currentUser?.permissionLevel);
        logger.debug('   User BranchId:', currentUser?.branchId);
        logger.debug('   User BranchId Type:', typeof currentUser?.branchId);
        logger.debug(
          '   User BranchId === "jYPEEhrb7iNGqumvV80L":',
          currentUser?.branchId === 'jYPEEhrb7iNGqumvV80L'
        );
        logger.debug('   Customer ID:', customerToDelete.id);
        logger.debug('   Customer Name:', customerToDelete.name);
        logger.debug('   Customer BranchId:', customerToDelete.branchId);

        // Try to get the actual token claims
        if (firebaseUser) {
          try {
            const tokenResult = await firebaseUser.getIdTokenResult(true);
            logger.debug('ACTUAL TOKEN CLAIMS:');
            logger.debug('   Token Claims:', JSON.stringify(tokenResult.claims, null, 2));
            logger.debug('   Token Permission Level:', tokenResult.claims.permissionLevel);
            logger.debug('   Token BranchId:', tokenResult.claims.branchId);
            logger.debug('   Token Role:', tokenResult.claims.role);
          } catch (tokenError) {
            logger.error('Error getting token:', tokenError);
          }
        }

        await deleteCustomer(customerToDelete.id, currentUser || undefined);
        setShowDeleteModal(false);
        setCustomerToDelete(null);
        await fetchCustomers();
        showSuccess(
          t('admin.customerManagement.customerDeletedSuccessfully') ||
            'Customer deleted successfully'
        );
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        // Use the error message from service if available, otherwise use generic message
        const errorMsg =
          error.message || t('admin.errors.failedToDeleteCustomer') || 'Failed to delete customer';
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveCustomer = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        await updateCustomer(editingCustomer.id, formData, currentUser || undefined);
        setShowEditModal(false);
        setEditingCustomer(null);
      } else {
        // Create new customer
        if (!currentUser?.branchId && currentUser?.role !== 'superadmin') {
          throw new Error('Branch ID is required to create a customer');
        }

        await createCustomer({
          ...formData,
          parentCompanyId: formData.parentCompanyId || undefined,
          createdBy: currentUser?.uid || '',
          branchId: currentUser?.branchId || undefined,
        } as any);
        setShowCreateModal(false);
      }
      await fetchCustomers();
      clearFormErrors();

      // Show success toast
      if (editingCustomer) {
        showSuccess(
          t('admin.customerManagement.customerUpdatedSuccessfully') ||
            'Customer updated successfully'
        );
      } else {
        showSuccess(
          t('admin.customerManagement.customerCreatedSuccessfully') ||
            'Customer created successfully'
        );
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      const errorMsg = t('admin.errors.failedToSaveCustomer') || 'Failed to save customer';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCustomerData = (customer: Customer) => {
    const data = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      company: customer.company,
      totalReports: customer.totalReports,
      totalRevenue: customer.totalRevenue,
      lastReportDate: customer.lastReportDate,
      createdAt: customer.createdAt,
      notes: customer.notes,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name.replace(/\s+/g, '_')}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle opening invitation modal
  const handleGenerateSignupLink = async (customer: Customer) => {
    setInvitationCustomer(customer);
    setGeneratedLink(null);
    setLinkCopied(false);
    setShowInvitationModal(true);

    // Load existing invitations for this customer
    try {
      const invitations = await getInvitationsForCustomer(customer.id);
      setCustomerInvitations(invitations.filter(inv => inv.status === 'pending'));
    } catch (error) {
      console.error('Error loading invitations:', error);
      setCustomerInvitations([]);
    }
  };

  // Generate new invitation link
  const handleCreateInvitation = async () => {
    if (!invitationCustomer || !currentUser) return;

    setGeneratingLink(true);
    try {
      const invitation = await createCustomerInvitation(
        invitationCustomer.id,
        invitationCustomer.name,
        currentUser.branchId || '',
        currentUser.uid,
        invitationCustomer.email
      );

      const signupUrl = getSignupUrl(invitation.token);
      setGeneratedLink(signupUrl);
      setCustomerInvitations(prev => [invitation, ...prev]);
      showSuccess(t('customer.invitation.created') || 'Signup link created successfully!');
    } catch (error) {
      console.error('Error creating invitation:', error);
      showError(t('customer.invitation.error') || 'Failed to create signup link');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      showSuccess(t('customer.invitation.copied') || 'Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error('Error copying link:', error);
      showError(t('customer.invitation.copyError') || 'Failed to copy link');
    }
  };

  // Format date (robust against invalid/Firestore Timestamp) using locale-specific format
  const formatDate = (value: any) => {
    try {
      const d = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value);
      if (!value || isNaN(d.getTime())) return '-';
      // Use locale-specific date format (dd/mm/yyyy for Danish, yyyy-mm-dd for Swedish)
      const localeCode =
        currentLocale === 'da-DK' ? 'da-DK' : currentLocale === 'sv-SE' ? 'sv-SE' : 'en-US';
      return d.toLocaleDateString(localeCode, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  // Format currency using locale-based utility
  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, currentLocale);
  };

  if (
    !currentUser ||
    (currentUser.role !== 'superadmin' &&
      currentUser.role !== 'branchAdmin' &&
      currentUser.role !== 'inspector')
  ) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-6xl mb-4'>🚫</div>
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>{t('errors.access.denied')}</h2>
          <p className='text-slate-600'>{t('errors.access.deniedMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-material'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Material Design Header */}
        <div className='mb-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
                {isReadOnly ? t('customer.title.directory') : t('customer.title')}
              </h1>
              <p className='mt-2 text-slate-600'>
                {isReadOnly
                  ? t('customer.subtitle.directory', { count: filteredAndSortedCustomers.length })
                  : t('customer.subtitle.management', { count: filteredAndSortedCustomers.length })}
              </p>
            </div>
            <div className='flex space-x-3'>
              {!isReadOnly && (
                <button
                  onClick={handleCreateCustomer}
                  className='inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm hover:shadow-md text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-all uppercase tracking-wide'
                >
                  <Plus className='h-5 w-5 mr-2' />
                  {t('customer.addCustomer')}
                </button>
              )}
              <button
                onClick={() => fetchCustomers()}
                className='inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50'
              >
                {t('customer.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
          <div className='space-y-4'>
            {/* Search Bar - Enhanced */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                {t('customer.searchLabel')}
              </label>
              <div className='relative'>
                <Search className='h-5 w-5 absolute left-3 top-3 text-slate-400' />
                <input
                  type='text'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('customer.searchPlaceholderEnhanced')}
                  className='pl-10 pr-10 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='absolute right-3 top-3 text-slate-400 hover:text-slate-600'
                    title={t('customer.clearSearch')}
                  >
                    <XCircle className='h-4 w-4' />
                  </button>
                )}
              </div>
              <p className='mt-1 text-sm text-slate-500'>
                {filteredAndSortedCustomers.length === 1
                  ? t('customer.searchResults.singular', { count: 1 })
                  : t('customer.searchResults.plural', {
                      count: filteredAndSortedCustomers.length,
                    })}
                {searchTerm && ` ${t('customer.searchMatching', { term: searchTerm })}`}
              </p>
            </div>

            {/* Quick Filter Presets */}
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => applyQuickFilter('hasReports')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === 'hasReports' && filterMinRevenue === undefined
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('customer.filters.hasReports')}
              </button>
              <button
                onClick={() => applyQuickFilter('noReports')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === 'noReports' && filterMinRevenue === undefined
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('customer.filters.noReports')}
              </button>
              <button
                onClick={() => applyQuickFilter('highValue')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterMinRevenue === 50000
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('customer.filters.highValue')}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className='px-3 py-1.5 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors'
                >
                  {t('customer.filters.clearFilters')} ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <div className='flex items-center justify-between pt-2 border-t border-slate-200'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='text-sm text-blue-600 hover:text-blue-800 font-medium'
              >
                {showFilters ? '▼' : '▶'} {t('customer.filters.advancedFilters')}
                {activeFilterCount > 0 && (
                  <span className='ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200'>
                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    {t('customer.filters.statusFilter')}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={e =>
                      setFilterStatus(e.target.value as 'all' | 'hasReports' | 'noReports')
                    }
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  >
                    <option value='all'>{t('customer.filters.allCustomers')}</option>
                    <option value='hasReports'>{t('customer.filters.hasReports')}</option>
                    <option value='noReports'>{t('customer.filters.noReports')}</option>
                  </select>
                </div>

                {/* Revenue Filter */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    {t('customer.filters.minRevenue')}
                  </label>
                  <input
                    type='number'
                    value={filterMinRevenue || ''}
                    onChange={e =>
                      setFilterMinRevenue(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder={t('customer.filters.enterAmount')}
                    min='0'
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  />
                </div>

                {/* Parent Company Filter */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Huvudföretag
                  </label>
                  <select
                    value={filterParentCompany || ''}
                    onChange={e => setFilterParentCompany(e.target.value || null)}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  >
                    <option value=''>Alla företag</option>
                    <option value='none'>Endast huvudföretag</option>
                    {customers
                      .filter(c => c.customerType === 'company' && !c.parentCompanyId)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {filterParentCompany && filterParentCompany !== 'none' && (
                    <button
                      onClick={() => setFilterParentCompany(null)}
                      className='mt-1 text-xs text-blue-600 hover:text-blue-800'
                    >
                      Rensa filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sort Controls */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200'>
              {/* Sort By */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('customer.sortBy')} {sortOrder === 'asc' ? '↑' : '↓'}
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='name'>{t('customer.name')}</option>
                  <option value='totalRevenue'>{t('dashboard.revenue')}</option>
                  <option value='totalReports'>{t('dashboard.totalReports')}</option>
                  <option value='createdAt'>{t('customer.created')}</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  {t('customer.sortOrder')}
                </label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='asc'>{t('customer.sortOrderAscending')}</option>
                  <option value='desc'>{t('customer.sortOrderDescending')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-slate-600'>Loading customers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-6'>
            <div className='flex items-start'>
              <div className='text-red-400'>
                <XCircle className='h-5 w-5' />
              </div>
              <div className='ml-3 flex-1'>
                <h3 className='text-sm font-medium text-red-800'>
                  {t('customer.errorState.title')}
                </h3>
                <p className='mt-1 text-sm text-red-700'>{error}</p>
                <div className='mt-3'>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchCustomers();
                    }}
                    className='inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  >
                    <AlertTriangle className='h-4 w-4 mr-2' />
                    {t('customer.errorState.retry')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Table */}
        {!loading && !error && (
          <div className='bg-white shadow overflow-hidden sm:rounded-md'>
            {viewMode === 'hierarchy' ? (
              // Hierarchy View
              <div className='p-6'>
                <h2 className='text-lg font-medium text-slate-900 mb-4'>Företagshierarki</h2>
                <div className='space-y-4'>
                  {customers
                    .filter(c => c.customerType === 'company' && !c.parentCompanyId)
                    .map(parentCompany => {
                      const subCompanies = customers.filter(
                        c => c.parentCompanyId === parentCompany.id
                      );
                      return (
                        <div
                          key={parentCompany.id}
                          className='border border-slate-200 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center gap-2'>
                              <Building className='h-5 w-5 text-green-600' />
                              <h3 className='text-base font-semibold text-slate-900'>
                                {parentCompany.name}
                              </h3>
                              <span className='px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full'>
                                Huvudföretag
                              </span>
                              {subCompanies.length > 0 && (
                                <button
                                  onClick={() => {
                                    setFilterParentCompany(parentCompany.id);
                                    setViewMode('list');
                                  }}
                                  className='text-sm text-slate-500 hover:text-blue-600 underline'
                                >
                                  ({subCompanies.length} dotterbolag)
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditCustomer(parentCompany)}
                              className='text-blue-600 hover:text-blue-800 text-sm'
                            >
                              Redigera
                            </button>
                          </div>
                          {subCompanies.length > 0 && (
                            <div className='ml-8 mt-3 space-y-2 border-l-2 border-purple-200 pl-4'>
                              {subCompanies.map(subCompany => (
                                <div
                                  key={subCompany.id}
                                  className='flex items-center justify-between py-2'
                                >
                                  <div className='flex items-center gap-2'>
                                    <Building className='h-4 w-4 text-purple-600' />
                                    <span className='text-sm font-medium text-slate-900'>
                                      {subCompany.name}
                                    </span>
                                    <span className='px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full'>
                                      Dotterbolag
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleEditCustomer(subCompany)}
                                    className='text-blue-600 hover:text-blue-800 text-sm'
                                  >
                                    Redigera
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {customers.filter(c => c.customerType === 'company' && !c.parentCompanyId)
                    .length === 0 && (
                    <p className='text-sm text-slate-500 text-center py-4'>
                      Inga huvudföretag hittades. Skapa ett företag för att börja bygga hierarkin.
                    </p>
                  )}
                </div>
              </div>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <EmptyState
                icon={Building}
                title={
                  searchTerm
                    ? t('customer.emptyState.noCustomersFound')
                    : t('customer.emptyState.noCustomersYet')
                }
                description={
                  searchTerm
                    ? t('customer.emptyState.tryAdjustingSearch')
                    : isReadOnly
                      ? t('customer.emptyState.noCustomersCreatedYet')
                      : t('customer.emptyState.createFirstCustomer')
                }
                actionLabel={
                  searchTerm || isReadOnly ? undefined : t('customer.emptyState.createNewCustomer')
                }
                onAction={searchTerm || isReadOnly ? undefined : handleCreateCustomer}
              />
            ) : (
              <div className='overflow-x-auto -mx-4 sm:mx-0'>
                <div className='inline-block min-w-full align-middle'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-slate-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                          {t('customer.name')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                          {t('customer.table.contact') || t('common.labels.phone')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                          {t('customer.table.stats') || 'Statistik'}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]'>
                          {t('customer.created')}
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-slate-50 z-10'>
                          {t('customer.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {filteredAndSortedCustomers.map(customer => (
                        <tr key={customer.id} className='hover:bg-slate-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div>
                              <div className='flex items-center gap-2'>
                                <button
                                  onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                  className='text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors'
                                >
                                  {customer.name}
                                </button>
                                {customer.customerType === 'company' && (
                                  <span className='px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full'>
                                    {t('customer.type.company') || 'Company'}
                                  </span>
                                )}
                              </div>
                              {customer.company && (
                                <div className='text-sm text-slate-500'>{customer.company}</div>
                              )}
                              {customer.customerType === 'company' && customer.buildingAddress && (
                                <div className='text-sm text-slate-500 mt-1'>
                                  <MapPin className='h-3 w-3 inline mr-1' />
                                  {customer.buildingAddress}
                                </div>
                              )}
                              {customer.parentCompanyId && (
                                <div className='text-xs text-purple-600 mt-1 flex items-center gap-1'>
                                  <Building className='h-3 w-3' />
                                  <span>
                                    Dotterbolag av:{' '}
                                    <button
                                      onClick={() => {
                                        setFilterParentCompany(customer.parentCompanyId || null);
                                        setViewMode('list');
                                      }}
                                      className='underline hover:text-purple-800 font-medium'
                                    >
                                      {customers.find(c => c.id === customer.parentCompanyId)
                                        ?.name || 'Okänt företag'}
                                    </button>
                                  </span>
                                </div>
                              )}
                              {customer.customerType === 'company' && !customer.parentCompanyId && (
                                <div className='text-xs text-green-600 mt-1 flex items-center gap-1'>
                                  <Building className='h-3 w-3' />
                                  <span>Huvudföretag</span>
                                  {customers.filter(c => c.parentCompanyId === customer.id).length >
                                    0 && (
                                    <span className='ml-1'>
                                      (
                                      {
                                        customers.filter(c => c.parentCompanyId === customer.id)
                                          .length
                                      }{' '}
                                      dotterbolag)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='space-y-1'>
                              {customer.email && (
                                <div className='flex items-center text-sm text-slate-600'>
                                  <Mail className='h-4 w-4 mr-2 text-slate-400' />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className='flex items-center text-sm text-slate-600'>
                                  <Phone className='h-4 w-4 mr-2 text-slate-400' />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.address && (
                                <div className='flex items-center text-sm text-slate-600'>
                                  <MapPin className='h-4 w-4 mr-2 text-slate-400' />
                                  {customer.address}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='space-y-1'>
                              <div className='flex items-center text-sm text-slate-600'>
                                <FileText className='h-4 w-4 mr-2 text-slate-400' />
                                {customer.totalReports || 0} {t('customer.stats.reports')}
                              </div>
                              <div className='flex items-center text-sm font-medium text-green-600'>
                                <DollarSign className='h-4 w-4 mr-1 text-slate-400' />
                                {formatCurrency(customer.totalRevenue || 0)}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600 min-w-[100px]'>
                            <span className='block'>{formatDate(customer.createdAt)}</span>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10'>
                            <div className='flex space-x-2'>
                              <Tooltip content='View Customer Details'>
                                <button
                                  onClick={() => handleViewCustomer(customer)}
                                  className='text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                              </Tooltip>
                              {!isReadOnly && (
                                <>
                                  <Tooltip content='Edit Customer'>
                                    <button
                                      onClick={() => handleEditCustomer(customer)}
                                      className='text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50'
                                    >
                                      <Edit className='h-4 w-4' />
                                    </button>
                                  </Tooltip>
                                  <Tooltip content='Delete Customer'>
                                    <button
                                      onClick={() => handleDeleteCustomer(customer)}
                                      className='text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50'
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </button>
                                  </Tooltip>
                                </>
                              )}
                              {!isReadOnly && (
                                <Tooltip content='Export Data (GDPR)'>
                                  <button
                                    onClick={() => exportCustomerData(customer)}
                                    className='text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50'
                                  >
                                    <Download className='h-4 w-4' />
                                  </button>
                                </Tooltip>
                              )}
                              {!isReadOnly && (
                                <Tooltip
                                  content={
                                    t('customer.invitation.generate') || 'Generate Signup Link'
                                  }
                                >
                                  <button
                                    onClick={() => handleGenerateSignupLink(customer)}
                                    className='text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50'
                                  >
                                    <Link2 className='h-4 w-4' />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className='fixed inset-0 bg-slate-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-slate-900'>
                  Customer Details - {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className='text-slate-400 hover:text-slate-600'
                >
                  <XCircle className='h-6 w-6' />
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-medium text-slate-900 mb-2'>Contact Information</h4>
                  <div className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>Name:</span> {selectedCustomer.name}
                    </p>
                    <p>
                      <span className='font-medium'>Company:</span>{' '}
                      {selectedCustomer.company || 'N/A'}
                    </p>
                    <p>
                      <span className='font-medium'>Email:</span> {selectedCustomer.email || 'N/A'}
                    </p>
                    <p>
                      <span className='font-medium'>Phone:</span> {selectedCustomer.phone || 'N/A'}
                    </p>
                    <p>
                      <span className='font-medium'>Address:</span>{' '}
                      {selectedCustomer.address || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className='font-medium text-slate-900 mb-2'>
                    {t('customer.businessInfo.title')}
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>
                        {t('customer.businessInfo.totalReports')}:
                      </span>{' '}
                      {selectedCustomer.totalReports || 0}
                    </p>
                    <p>
                      <span className='font-medium'>
                        {t('customer.businessInfo.totalRevenue')}:
                      </span>{' '}
                      {formatCurrency(selectedCustomer.totalRevenue || 0)}
                    </p>
                    <p>
                      <span className='font-medium'>{t('customer.businessInfo.lastReport')}:</span>{' '}
                      {selectedCustomer.lastReportDate
                        ? formatDate(selectedCustomer.lastReportDate)
                        : 'Never'}
                    </p>
                    <p>
                      <span className='font-medium'>Created:</span>{' '}
                      {formatDate(selectedCustomer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className='mt-6'>
                  <h4 className='font-medium text-slate-900 mb-2'>Notes</h4>
                  <p className='text-sm text-slate-600 bg-slate-50 p-3 rounded-lg'>
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}

              <div className='mt-6 flex justify-end space-x-3'>
                {isReadOnly && (
                  <button
                    onClick={() => {
                      navigate(
                        `/report/new?customerId=${selectedCustomer.id}&customerName=${encodeURIComponent(selectedCustomer.name)}&customerAddress=${encodeURIComponent(selectedCustomer.address || '')}`
                      );
                      setSelectedCustomer(null);
                    }}
                    className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm flex items-center'
                  >
                    <FilePlus className='h-4 w-4 mr-2' />
                    Create Report
                  </button>
                )}
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => exportCustomerData(selectedCustomer)}
                      className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                    >
                      Export Data (GDPR)
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(selectedCustomer)}
                      className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center'
                    >
                      <Trash2 className='h-4 w-4 mr-2' />
                      {t('common.delete')}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className='px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className='fixed inset-0 bg-slate-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-slate-900'>
                  {showCreateModal ? t('customer.createCustomer') : t('customer.editCustomer')}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingCustomer(null);
                  }}
                  className='text-slate-400 hover:text-slate-600'
                >
                  <XCircle className='h-6 w-6' />
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.name')} *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) {
                        clearFormErrors();
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      formErrors.name
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder={t('customer.form.namePlaceholder')}
                    required
                  />
                  {formErrors.name && (
                    <p className='mt-1 text-sm text-red-600'>{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.email')}
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) {
                        clearFormErrors();
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      formErrors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder={t('customer.form.emailPlaceholder')}
                  />
                  {formErrors.email && (
                    <p className='mt-1 text-sm text-red-600'>{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.phone')}
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, phone: e.target.value }));
                      if (formErrors.phone) {
                        clearFormErrors();
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      formErrors.phone
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder={t('customer.form.phonePlaceholder')}
                  />
                  {formErrors.phone && (
                    <p className='mt-1 text-sm text-red-600'>{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.address')}
                  </label>
                  <input
                    type='text'
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                    placeholder={t('customer.form.addressPlaceholder')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.customerType') || 'Kundtyp'}
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        customerType: e.target.value as 'individual' | 'company',
                        parentCompanyId:
                          e.target.value === 'individual' ? undefined : prev.parentCompanyId,
                      }))
                    }
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  >
                    <option value='individual'>
                      {t('customer.form.individual') || 'Privatperson'}
                    </option>
                    <option value='company'>{t('customer.form.company') || 'Företag'}</option>
                  </select>
                </div>

                {formData.customerType === 'company' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('customer.form.parentCompany') || 'Huvudföretag (valfritt)'}
                    </label>
                    <select
                      value={formData.parentCompanyId || ''}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          parentCompanyId: e.target.value || undefined,
                        }))
                      }
                      className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                    >
                      <option value=''>
                        {t('customer.form.noParent') || 'Ingen (huvudföretag)'}
                      </option>
                      {customers
                        .filter(
                          c =>
                            c.customerType === 'company' &&
                            c.id !== editingCustomer?.id &&
                            !c.parentCompanyId
                        )
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <p className='mt-1 text-xs text-slate-500'>
                      {t('customer.form.parentCompanyHelp') ||
                        'Välj ett huvudföretag om detta är en dotterbolag'}
                    </p>
                  </div>
                )}

                {formData.customerType === 'company' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('customer.form.buildingAddress') || 'Byggnadsadress'}
                    </label>
                    <input
                      type='text'
                      value={formData.buildingAddress}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, buildingAddress: e.target.value }))
                      }
                      className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                      placeholder={
                        t('customer.form.buildingAddressPlaceholder') ||
                        'Om den skiljer sig från huvudadressen'
                      }
                    />
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.companyName') || 'Company'}
                  </label>
                  <input
                    type='text'
                    value={formData.company}
                    onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('customer.form.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder={t('customer.form.notesPlaceholder')}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  />
                </div>
              </div>

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingCustomer(null);
                  }}
                  className='px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50'
                >
                  {t('common.buttons.cancel')}
                </button>
                <button
                  onClick={handleSaveCustomer}
                  disabled={isSubmitting}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      {showCreateModal
                        ? t('customer.form.creating') || 'Creating...'
                        : t('customer.form.updating') || 'Updating...'}
                    </>
                  ) : showCreateModal ? (
                    t('customer.form.create') || 'Create'
                  ) : (
                    t('customer.form.update') || 'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteCustomer}
          title={t('customer.actions.delete') || t('common.delete')}
          message={
            customerToDelete
              ? customerToDelete.totalReports && customerToDelete.totalReports > 0
                ? `${t('common.deleteCustomerConfirmation', { name: customerToDelete.name })} ${t('customer.confirmDeleteWithReports', { count: customerToDelete.totalReports })}`
                : t('common.deleteCustomerConfirmation', { name: customerToDelete.name })
              : ''
          }
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type='danger'
          icon='trash'
          isLoading={isDeleting}
        />

        {/* Invitation Link Modal */}
        {showInvitationModal && invitationCustomer && (
          <div className='fixed inset-0 bg-slate-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-slate-900'>
                  {t('customer.invitation.title') || 'Generate Signup Link'}
                </h3>
                <button
                  onClick={() => {
                    setShowInvitationModal(false);
                    setInvitationCustomer(null);
                    setGeneratedLink(null);
                  }}
                  className='text-slate-400 hover:text-slate-600'
                >
                  <XCircle className='h-6 w-6' />
                </button>
              </div>

              <div className='space-y-4'>
                <p className='text-sm text-slate-600'>
                  {t('customer.invitation.description') || 'Generate a signup link for'}{' '}
                  <span className='font-medium'>{invitationCustomer.name}</span>.{' '}
                  {t('customer.invitation.expiryNote') || 'The link will be valid for 14 days.'}
                </p>

                {/* Existing active invitations */}
                {customerInvitations.length > 0 && (
                  <div className='border rounded-md p-3 bg-slate-50'>
                    <p className='text-sm font-medium text-slate-700 mb-2'>
                      {t('customer.invitation.existingLinks') || 'Existing active links:'}
                    </p>
                    <div className='space-y-2'>
                      {customerInvitations.map(inv => (
                        <div key={inv.id} className='flex items-center justify-between text-xs'>
                          <span className='text-slate-500'>
                            {t('customer.invitation.expires') || 'Expires'}:{' '}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleCopyLink(getSignupUrl(inv.token))}
                            className='text-blue-600 hover:text-blue-800 flex items-center gap-1'
                          >
                            <Copy className='h-3 w-3' />
                            {t('customer.invitation.copy') || 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated link display */}
                {generatedLink && (
                  <div className='border rounded-md p-3 bg-green-50 border-green-200'>
                    <p className='text-sm font-medium text-green-800 mb-2'>
                      {t('customer.invitation.newLink') || 'New signup link created!'}
                    </p>
                    <div className='flex items-center gap-2'>
                      <input
                        type='text'
                        value={generatedLink}
                        readOnly
                        className='flex-1 text-xs p-2 border rounded bg-white font-mono'
                      />
                      <button
                        onClick={() => handleCopyLink(generatedLink)}
                        className={`p-2 rounded ${
                          linkCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {linkCopied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate button */}
                <div className='flex justify-end gap-3 pt-2'>
                  <button
                    onClick={() => {
                      setShowInvitationModal(false);
                      setInvitationCustomer(null);
                      setGeneratedLink(null);
                    }}
                    className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50'
                  >
                    {t('common.close') || 'Close'}
                  </button>
                  <button
                    onClick={handleCreateInvitation}
                    disabled={generatingLink}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  >
                    {generatingLink ? (
                      <>
                        <RefreshCw className='h-4 w-4 animate-spin' />
                        {t('common.generating') || 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Link2 className='h-4 w-4' />
                        {t('customer.invitation.generateNew') || 'Generate New Link'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
