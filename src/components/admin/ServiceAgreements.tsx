import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { ServiceAgreement } from '../../types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Map,
  List,
  RefreshCw,
  AlertCircle,
  Calendar,
  FileCheck,
  XCircle,
} from 'lucide-react';
import ConfirmationDialog from '../common/ConfirmationDialog';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  getServiceAgreements,
  getAgreementsAlmostDue,
  getAgreementsDueTomorrow,
  getAgreementsDueInWeek,
  getAgreementsDueInTwoWeeks,
  deleteServiceAgreement,
} from '../../services/serviceAgreementService';
import ServiceAgreementMap from '../serviceAgreements/ServiceAgreementMap';
import ServiceAgreementForm from '../serviceAgreements/ServiceAgreementForm';
import ServiceAgreementDetail from '../serviceAgreements/ServiceAgreementDetail';

const ServiceAgreements: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();

  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'cancelled' | 'pending'>('all');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'almostDue' | 'dueTomorrow' | 'dueInWeek' | 'dueInTwoWeeks'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'maintenance' | 'inspection' | 'repair' | 'other'>('all');
  
  // Status counts
  const [almostDueCount, setAlmostDueCount] = useState(0);
  const [dueTomorrowCount, setDueTomorrowCount] = useState(0);
  const [dueInWeekCount, setDueInWeekCount] = useState(0);
  const [dueInTwoWeeksCount, setDueInTwoWeeksCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<ServiceAgreement | null>(null);
  const [agreementToDelete, setAgreementToDelete] = useState<ServiceAgreement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch agreements
  const fetchAgreements = async () => {
    try {
      setLoading(true);
      setError(null);
      const branchId = currentUser?.role === 'superadmin' ? undefined : currentUser?.branchId;
      const agreementsData = await getServiceAgreements(branchId);
      setAgreements(agreementsData);
      // Only set error if there's an actual error, not if the array is empty
      // Empty array means no agreements exist, which is a valid state
    } catch (error) {
      console.error('Error fetching service agreements:', error);
      // Only show error for actual connection/network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network') || errorMessage.includes('permission')) {
        setError(t('serviceAgreement.errorMessage'));
      } else {
        // For other errors, still show error but allow empty state to show if agreements is empty
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts from agreements (client-side)
  const calculateStatusCounts = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    let almostDue = 0;
    let dueTomorrow = 0;
    let dueInWeek = 0;
    let dueInTwoWeeks = 0;

    // Use Set to track unique agreement IDs to prevent double counting
    const seenIds = new Set<string>();

    agreements.forEach(agreement => {
      // Skip if we've already counted this agreement
      if (seenIds.has(agreement.id)) {
        return;
      }
      seenIds.add(agreement.id);

      // Count all agreements regardless of status (pending, active, etc.)
      const nextServiceDate = new Date(agreement.nextServiceDate);
      nextServiceDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Count agreements that are due (not overdue)
      if (daysUntilDue >= 0) {
        if (daysUntilDue <= 3) almostDue++;
        if (daysUntilDue === 0 || daysUntilDue === 1) dueTomorrow++;
        if (daysUntilDue <= 7) dueInWeek++;
        if (daysUntilDue <= 14) dueInTwoWeeks++;
      }
    });

    setAlmostDueCount(almostDue);
    setDueTomorrowCount(dueTomorrow);
    setDueInWeekCount(dueInWeek);
    setDueInTwoWeeksCount(dueInTwoWeeks);
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'branchAdmin')) {
      fetchAgreements();
    }
  }, [currentUser]);

  // Calculate counts whenever agreements change
  useEffect(() => {
    calculateStatusCounts();
  }, [agreements]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort agreements
  const filteredAgreements = useMemo(() => {
    let filtered = agreements.filter(agreement => {
      // Search filter
      const matchesSearch =
        debouncedSearchTerm === '' ||
        agreement.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        agreement.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        agreement.customerAddress?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || agreement.agreementType === typeFilter;

      // Due date filter
      let matchesDueDate = true;
      if (dueDateFilter !== 'all') {
        const now = new Date();
        const nextServiceDate = new Date(agreement.nextServiceDate);
        const daysUntilDue = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        switch (dueDateFilter) {
          case 'almostDue':
            matchesDueDate = daysUntilDue <= 3 && daysUntilDue >= 0;
            break;
          case 'dueTomorrow':
            matchesDueDate = daysUntilDue === 1 || daysUntilDue === 0;
            break;
          case 'dueInWeek':
            matchesDueDate = daysUntilDue <= 7 && daysUntilDue >= 0;
            break;
          case 'dueInTwoWeeks':
            matchesDueDate = daysUntilDue <= 14 && daysUntilDue >= 0;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDueDate;
    });

    // Sort by next service date
    filtered.sort((a, b) => {
      const dateA = new Date(a.nextServiceDate).getTime();
      const dateB = new Date(b.nextServiceDate).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [agreements, debouncedSearchTerm, statusFilter, typeFilter, dueDateFilter]);

  // Handle actions
  const handleCreate = () => {
    setSelectedAgreement(null);
    setShowCreateModal(true);
  };

  const handleEdit = (agreement: ServiceAgreement) => {
    setSelectedAgreement(agreement);
    setShowEditModal(true);
  };

  const handleView = (agreement: ServiceAgreement) => {
    setSelectedAgreement(agreement);
    setShowDetailModal(true);
  };

  const handleDelete = (agreement: ServiceAgreement) => {
    setAgreementToDelete(agreement);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (agreementToDelete) {
      setIsDeleting(true);
      try {
        await deleteServiceAgreement(agreementToDelete.id);
        showSuccess(t('serviceAgreement.deleted'));
        await fetchAgreements();
        setShowDeleteModal(false);
        setAgreementToDelete(null);
      } catch (error) {
        console.error('Error deleting service agreement:', error);
        showError(t('common.errorState.title'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleFormSuccess = async () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedAgreement(null);
    await fetchAgreements();
  };

  // Calculate days until due
  const getDaysUntilDue = (nextServiceDate: string): number => {
    const now = new Date();
    const dueDate = new Date(nextServiceDate);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get due date badge
  const getDueDateBadge = (nextServiceDate: string) => {
    const days = getDaysUntilDue(nextServiceDate);
    if (days < 0) {
      return { text: t('serviceAgreement.dueDate.overdue'), color: 'bg-red-100 text-red-800' };
    } else if (days === 0) {
      return { text: t('serviceAgreement.dueDate.today'), color: 'bg-red-100 text-red-800' };
    } else if (days === 1) {
      return { text: t('serviceAgreement.dueDate.tomorrow'), color: 'bg-orange-100 text-orange-800' };
    } else if (days <= 3) {
      return { text: `${days} ${t('serviceAgreement.dueDate.days')}`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: `${days} ${t('serviceAgreement.dueDate.days')}`, color: 'bg-blue-100 text-blue-800' };
    }
  };

  if (loading && agreements.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
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
                {t('serviceAgreement.title')}
              </h1>
              <p className='mt-2 text-slate-600'>
                {t('serviceAgreement.subtitle', { count: filteredAgreements.length })}
              </p>
            </div>
            <div className='flex space-x-3'>
              <button
                onClick={handleCreate}
                className='inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm hover:shadow-md text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-all uppercase tracking-wide'
              >
                <Plus className='h-5 w-5 mr-2' />
                {t('serviceAgreement.addAgreement')}
              </button>
              <button
                onClick={fetchAgreements}
                className='inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50'
              >
                {t('serviceAgreement.refresh') || 'Uppdatera'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Boxes */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <button
          onClick={() => setDueDateFilter('almostDue')}
          className={`p-4 rounded-lg border-2 transition-all ${
            dueDateFilter === 'almostDue'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>{t('serviceAgreement.statusFilters.almostDue')}</p>
              <p className='text-2xl font-bold text-gray-900'>{almostDueCount}</p>
            </div>
            <AlertCircle className='h-8 w-8 text-orange-500' />
          </div>
        </button>

        <button
          onClick={() => setDueDateFilter('dueTomorrow')}
          className={`p-4 rounded-lg border-2 transition-all ${
            dueDateFilter === 'dueTomorrow'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>{t('serviceAgreement.statusFilters.dueTomorrow')}</p>
              <p className='text-2xl font-bold text-gray-900'>{dueTomorrowCount}</p>
            </div>
            <Calendar className='h-8 w-8 text-red-500' />
          </div>
        </button>

        <button
          onClick={() => setDueDateFilter('dueInWeek')}
          className={`p-4 rounded-lg border-2 transition-all ${
            dueDateFilter === 'dueInWeek'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>{t('serviceAgreement.statusFilters.dueInWeek')}</p>
              <p className='text-2xl font-bold text-gray-900'>{dueInWeekCount}</p>
            </div>
            <FileCheck className='h-8 w-8 text-yellow-500' />
          </div>
        </button>

        <button
          onClick={() => setDueDateFilter('dueInTwoWeeks')}
          className={`p-4 rounded-lg border-2 transition-all ${
            dueDateFilter === 'dueInTwoWeeks'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>{t('serviceAgreement.statusFilters.dueInTwoWeeks')}</p>
              <p className='text-2xl font-bold text-gray-900'>{dueInTwoWeeksCount}</p>
            </div>
            <Calendar className='h-8 w-8 text-blue-500' />
          </div>
        </button>
      </div>

        {/* Search and Filters */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 relative z-10'>
          <div className='space-y-4'>
            {/* Search Bar */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('serviceAgreement.searchLabel') || 'Sök serviceavtal'}
              </label>
              <div className='relative'>
                <Search className='h-5 w-5 absolute left-3 top-3 text-gray-400' />
                <input
                  type='text'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('serviceAgreement.searchPlaceholder')}
                  className='pl-10 pr-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                    title={t('serviceAgreement.clearSearch') || 'Rensa sökning'}
                  >
                    <XCircle className='h-4 w-4' />
                  </button>
                )}
              </div>
              <p className='mt-1 text-sm text-gray-500'>
                {filteredAgreements.length === 1
                  ? t('serviceAgreement.searchResults.singular', { count: 1 }) || 'Hittade 1 serviceavtal'
                  : t('serviceAgreement.searchResults.plural', { count: filteredAgreements.length }) || `Hittade ${filteredAgreements.length} serviceavtal`}
              </p>
            </div>

            {/* Filters Row */}
            <div className='flex flex-wrap gap-3 items-center'>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className='px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>{t('serviceAgreement.statusFilters.all')}</option>
                <option value='active'>{t('serviceAgreement.status.active')}</option>
                <option value='expired'>{t('serviceAgreement.status.expired')}</option>
                <option value='cancelled'>{t('serviceAgreement.status.cancelled')}</option>
                <option value='pending'>{t('serviceAgreement.status.pending')}</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className='px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>{t('serviceAgreement.statusFilters.all')}</option>
                <option value='maintenance'>{t('serviceAgreement.type.maintenance')}</option>
                <option value='inspection'>{t('serviceAgreement.type.inspection')}</option>
                <option value='repair'>{t('serviceAgreement.type.repair')}</option>
                <option value='other'>{t('serviceAgreement.type.other')}</option>
              </select>

              <div className='flex border border-gray-300 rounded-md overflow-hidden'>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  title={t('serviceAgreement.viewList') || 'Listvy'}
                >
                  <List className='h-5 w-5' />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 text-sm ${viewMode === 'map' ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  title={t('serviceAgreement.viewMap') || 'Kartvy'}
                >
                  <Map className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {/* Only show error if there's an actual error AND we have no agreements to show */}
        {error && agreements.length === 0 && (
          <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {viewMode === 'list' ? (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          {filteredAgreements.length === 0 ? (
            <EmptyState
              title={t('serviceAgreement.noAgreements')}
              message={t('serviceAgreement.noAgreementsMessage')}
              actionLabel={t('serviceAgreement.addAgreement')}
              onAction={handleCreate}
            />
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      {t('serviceAgreement.table.customer')}
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      {t('serviceAgreement.table.title')}
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      {t('serviceAgreement.table.type')}
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      {t('serviceAgreement.table.nextService')}
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      {t('serviceAgreement.table.status')}
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10'>
                      {t('serviceAgreement.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredAgreements.map((agreement) => {
                    const dueBadge = getDueDateBadge(agreement.nextServiceDate);
                    return (
                      <tr key={agreement.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>{agreement.customerName}</div>
                          <div className='text-sm text-gray-500'>{agreement.customerAddress}</div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>{agreement.title}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className='text-sm text-gray-500'>
                            {t(`serviceAgreement.type.${agreement.agreementType}`)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900'>
                            {new Date(agreement.nextServiceDate).toLocaleDateString()}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dueBadge.color}`}>
                            {dueBadge.text}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>
                            {t(`serviceAgreement.status.${agreement.status}`)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white z-10'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => handleView(agreement)}
                              className='text-blue-600 hover:text-blue-900'
                              title={t('serviceAgreement.viewAgreement')}
                              aria-label={t('serviceAgreement.viewAgreement')}
                            >
                              <Eye className='h-5 w-5' />
                            </button>
                            <button
                              onClick={() => handleEdit(agreement)}
                              className='text-indigo-600 hover:text-indigo-900'
                              title={t('serviceAgreement.editAgreement')}
                              aria-label={t('serviceAgreement.editAgreement')}
                            >
                              <Edit className='h-5 w-5' />
                            </button>
                            <button
                              onClick={() => handleDelete(agreement)}
                              className='text-red-600 hover:text-red-900'
                              title={t('serviceAgreement.deleteAgreement')}
                              aria-label={t('serviceAgreement.deleteAgreement')}
                            >
                              <Trash2 className='h-5 w-5' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <ServiceAgreementMap
          agreements={filteredAgreements}
          onAgreementClick={handleView}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <ServiceAgreementForm
          mode='create'
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {showEditModal && selectedAgreement && (
        <ServiceAgreementForm
          mode='edit'
          agreement={selectedAgreement}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAgreement(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetailModal && selectedAgreement && (
        <ServiceAgreementDetail
          agreement={selectedAgreement}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAgreement(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            handleEdit(selectedAgreement);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            handleDelete(selectedAgreement);
          }}
        />
      )}

      {showDeleteModal && agreementToDelete && (
        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setAgreementToDelete(null);
          }}
          onConfirm={confirmDelete}
          title={t('serviceAgreement.deleteAgreement')}
          message={t('serviceAgreement.confirmDelete')}
          confirmText={t('common.delete')}
          cancelText={t('common.buttons.cancel')}
          type='danger'
          icon='trash'
          isLoading={isDeleting}
        />
      )}

      </div>
    </div>
  );
};

export default ServiceAgreements;

