/**
 * ESG Reports List Component
 *
 * Displays an inventory of all ESG service reports for a branch.
 * Allows branch managers to view, edit, and manage ESG reports.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { ESGServiceReport } from '../../types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileText,
  Leaf,
  Copy,
  Building as BuildingIcon,
  User,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ConfirmationDialog from '../common/ConfirmationDialog';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import { getESGServiceReportsByBranch, deleteESGServiceReport } from '../../services/esgService';
import { getBuildingById } from '../../services/buildingService';
import { getCustomerById } from '../../services/customerService';
import { formatDate } from '../../utils/dateFormatter';

interface EnrichedReport extends ESGServiceReport {
  buildingName?: string;
  buildingAddress?: string;
  customerName?: string;
}

const ESGReportsList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();

  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private'>('all');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<EnrichedReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reports
  const fetchReports = async () => {
    if (!currentUser?.branchId) return;

    try {
      setLoading(true);
      setError(null);
      const branchId =
        currentUser?.role === 'superadmin' ? currentUser.branchId : currentUser.branchId;
      const reportsData = await getESGServiceReportsByBranch(branchId);

      // Enrich reports with building and customer names
      const enrichedReports = await Promise.all(
        reportsData.map(async report => {
          const enriched: EnrichedReport = { ...report };
          try {
            const building = await getBuildingById(report.buildingId);
            if (building) {
              enriched.buildingName = building.address;
              enriched.buildingAddress = building.address;
              if (building.customerId) {
                const customer = await getCustomerById(building.customerId);
                if (customer) {
                  enriched.customerName = customer.name || customer.company;
                }
              }
            }
          } catch (err) {
            console.error('Error enriching report:', err);
          }
          return enriched;
        })
      );

      setReports(enrichedReports);
    } catch (error) {
      console.error('Error fetching ESG reports:', error);
      setError(t('admin.esgReports.errorLoading') || 'Failed to load ESG reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentUser]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter reports based on search and status
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Status filter
      if (statusFilter === 'public' && !report.isPublic) return false;
      if (statusFilter === 'private' && report.isPublic) return false;

      // Search filter
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        const matchesBuilding = report.buildingName?.toLowerCase().includes(search);
        const matchesAddress = report.buildingAddress?.toLowerCase().includes(search);
        const matchesCustomer = report.customerName?.toLowerCase().includes(search);
        return matchesBuilding || matchesAddress || matchesCustomer;
      }

      return true;
    });
  }, [reports, statusFilter, debouncedSearchTerm]);

  // Handle delete confirmation
  const handleDeleteClick = (report: EnrichedReport) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      await deleteESGServiceReport(reportToDelete.id);
      showSuccess(t('admin.esgReports.deleteSuccess') || 'ESG report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      showError(t('admin.esgReports.deleteError') || 'Failed to delete report');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setReportToDelete(null);
    }
  };

  // Copy public link to clipboard
  const handleCopyLink = async (report: EnrichedReport) => {
    if (!report.publicLinkId) return;
    const publicUrl = `${window.location.origin}/esg-report/public/${report.publicLinkId}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      showSuccess(t('admin.esgReports.linkCopied') || 'Public link copied to clipboard');
    } catch (error) {
      showError(t('admin.esgReports.copyError') || 'Failed to copy link');
    }
  };

  // Open public report in new tab
  const handleViewPublic = (report: EnrichedReport) => {
    if (!report.publicLinkId) return;
    const publicUrl = `${window.location.origin}/esg-report/public/${report.publicLinkId}`;
    window.open(publicUrl, '_blank');
  };

  // Navigate to edit
  const handleEdit = (report: EnrichedReport) => {
    navigate(`/admin/esg-service?buildingId=${report.buildingId}`);
  };

  // Check permissions
  if (!currentUser || (currentUser.role !== 'branchAdmin' && currentUser.role !== 'superadmin')) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center'>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>
            {t('errors.access.denied') || 'Access Denied'}
          </h1>
          <p className='text-slate-600 mb-6'>
            {t('admin.esgReports.accessDenied') || 'You do not have permission to access this page'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-material'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t('admin.esgReports.title') || 'ESG Reports'}
          </h1>
          <p className='mt-2 text-gray-600'>
            {t('admin.esgReports.subtitle') || 'Manage and view all ESG service reports'}
          </p>
        </div>

        {/* Actions Bar */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6'>
          <div className='flex flex-col md:flex-row gap-4 justify-between'>
            {/* Search */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input
                type='text'
                placeholder={
                  t('admin.esgReports.searchPlaceholder') ||
                  'Search by building, address, or customer...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors'
              />
            </div>

            {/* Filters and Actions */}
            <div className='flex flex-wrap gap-3 items-center'>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'public' | 'private')}
                className='px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm'
              >
                <option value='all'>{t('admin.esgReports.filter.all') || 'All Reports'}</option>
                <option value='public'>
                  {t('admin.esgReports.filter.public') || 'Public Only'}
                </option>
                <option value='private'>
                  {t('admin.esgReports.filter.private') || 'Private Only'}
                </option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchReports}
                disabled={loading}
                className='flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh') || 'Refresh'}
              </button>

              {/* Create New */}
              <button
                onClick={() => navigate('/admin/esg-service')}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm'
              >
                <Plus className='w-4 h-4' />
                {t('admin.esgReports.createNew') || 'Create Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-6'>
            <div className='flex items-center gap-3'>
              <AlertCircle className='w-5 h-5 text-red-500' />
              <p className='text-red-700'>{error}</p>
              <button
                onClick={fetchReports}
                className='ml-auto text-sm text-red-600 hover:text-red-700 underline'
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <FileText className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-slate-500'>
                  {t('admin.esgReports.stats.total') || 'Total Reports'}
                </p>
                <p className='text-2xl font-bold text-slate-900'>{reports.length}</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <ExternalLink className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-slate-500'>
                  {t('admin.esgReports.stats.public') || 'Public Reports'}
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {reports.filter(r => r.isPublic).length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-amber-100 rounded-lg'>
                <Leaf className='w-5 h-5 text-amber-600' />
              </div>
              <div>
                <p className='text-sm text-slate-500'>
                  {t('admin.esgReports.stats.totalRoofArea') || 'Total Roof Area'}
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {reports.reduce((acc, r) => acc + (r.roofSize || 0), 0).toLocaleString()} m²
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              debouncedSearchTerm
                ? t('admin.esgReports.noSearchResults') || 'No reports found'
                : t('admin.esgReports.noReports') || 'No ESG reports yet'
            }
            description={
              debouncedSearchTerm
                ? t('admin.esgReports.tryDifferentSearch') || 'Try a different search term'
                : t('admin.esgReports.createFirstReport') ||
                  'Create your first ESG report to get started'
            }
            actionLabel={
              !debouncedSearchTerm ? t('admin.esgReports.createNew') || 'Create Report' : undefined
            }
            onAction={!debouncedSearchTerm ? () => navigate('/admin/esg-service') : undefined}
          />
        ) : (
          <div className='space-y-4'>
            {filteredReports.map(report => (
              <div
                key={report.id}
                className='bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow'
              >
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                  {/* Report Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='p-2 bg-green-100 rounded-lg'>
                        <Leaf className='w-5 h-5 text-green-600' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <h3 className='font-semibold text-slate-900 truncate'>
                          {report.buildingName ||
                            t('admin.esgReports.unknownBuilding') ||
                            'Unknown Building'}
                        </h3>
                        <p className='text-sm text-slate-500 truncate'>{report.buildingAddress}</p>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className='flex flex-wrap gap-4 text-sm text-slate-600'>
                      {report.customerName && (
                        <div className='flex items-center gap-1.5'>
                          <User className='w-4 h-4 text-slate-400' />
                          {report.customerName}
                        </div>
                      )}
                      <div className='flex items-center gap-1.5'>
                        <BuildingIcon className='w-4 h-4 text-slate-400' />
                        {report.roofSize?.toLocaleString()} m²
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <Calendar className='w-4 h-4 text-slate-400' />
                        {formatDate(report.createdAt)}
                      </div>
                      {/* Status Badge */}
                      {report.isPublic ? (
                        <div className='flex items-center gap-1.5'>
                          <CheckCircle className='w-4 h-4 text-green-500' />
                          <span className='text-green-600'>
                            {t('admin.esgReports.public') || 'Public'}
                          </span>
                        </div>
                      ) : (
                        <div className='flex items-center gap-1.5'>
                          <XCircle className='w-4 h-4 text-slate-400' />
                          <span className='text-slate-500'>
                            {t('admin.esgReports.private') || 'Private'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Division Summary */}
                    {report.divisions && (
                      <div className='mt-3 flex flex-wrap gap-2'>
                        <span className='text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full'>
                          🌿 {report.divisions.greenRoof}%
                        </span>
                        <span className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full'>
                          💨 {report.divisions.noxReduction}%
                        </span>
                        <span className='text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full'>
                          ❄️ {report.divisions.coolRoof}%
                        </span>
                        <span className='text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full'>
                          👥 {report.divisions.socialActivities}%
                        </span>
                      </div>
                    )}

                    {/* Calculated Metrics Summary */}
                    {report.calculatedMetrics && (
                      <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg'>
                        <div>
                          <p className='text-xs text-slate-500'>
                            {t('admin.esgReports.co2Saved') || 'CO₂ Saved/Year'}
                          </p>
                          <p className='font-semibold text-green-600'>
                            {(
                              (report.calculatedMetrics.co2ReductionKgPerYear ||
                                report.calculatedMetrics.annualCO2Offset ||
                                0) / 1000
                            ).toFixed(1)}{' '}
                            t
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-slate-500'>
                            {t('admin.esgReports.energySaved') || 'Energy Saved/Year'}
                          </p>
                          <p className='font-semibold text-blue-600'>
                            {(
                              report.calculatedMetrics.energySavingsKwhPerYear ||
                              report.calculatedMetrics.solarPotential ||
                              0
                            ).toLocaleString()}{' '}
                            kWh
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-slate-500'>
                            {t('admin.esgReports.sustainability') || 'Sustainability'}
                          </p>
                          <p className='font-semibold text-purple-600'>
                            {report.calculatedMetrics.sustainabilityScore?.toFixed(0) || 0}/100
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-slate-500'>
                            {t('admin.esgReports.rating') || 'Rating'}
                          </p>
                          <p className='font-semibold text-amber-600'>
                            {report.calculatedMetrics.rating || '-'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2 shrink-0'>
                    {/* View Public Link */}
                    {report.isPublic && report.publicLinkId && (
                      <>
                        <button
                          onClick={() => handleViewPublic(report)}
                          className='p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                          title={t('admin.esgReports.viewPublic') || 'View Public Report'}
                        >
                          <ExternalLink className='w-5 h-5' />
                        </button>
                        <button
                          onClick={() => handleCopyLink(report)}
                          className='p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                          title={t('admin.esgReports.copyLink') || 'Copy Public Link'}
                        >
                          <Copy className='w-5 h-5' />
                        </button>
                      </>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(report)}
                      className='p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors'
                      title={t('common.edit') || 'Edit'}
                    >
                      <Edit className='w-5 h-5' />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(report)}
                      className='p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      title={t('common.delete') || 'Delete'}
                    >
                      <Trash2 className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setReportToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={t('admin.esgReports.deleteTitle') || 'Delete ESG Report'}
          message={
            t('admin.esgReports.deleteMessage') ||
            `Are you sure you want to delete the ESG report for "${reportToDelete?.buildingName}"? This action cannot be undone.`
          }
          confirmText={t('common.delete') || 'Delete'}
          cancelText={t('common.cancel') || 'Cancel'}
          type='danger'
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default ESGReportsList;
