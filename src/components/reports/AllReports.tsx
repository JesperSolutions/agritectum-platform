import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { useFilterPersistence, useBranchContext } from '../../hooks/usePageState';
import { cleanupTempReports } from '../../utils/cleanupDraftReports';
import { debugUserAccount, findLinusHollberg } from '../../utils/debugUserAccount';
import { Report, Branch } from '../../types';
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Download,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';
import Tooltip from '../Tooltip';
import ConfirmationDialog from '../common/ConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { formatSwedishDate } from '../../utils/dateFormatter';
import { logger } from '../../utils/logger';

interface AllReportsProps {}

const AllReports: React.FC<AllReportsProps> = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reports, loading, error, fetchReports, deleteReport } =
    useReports();
  const { t, formatCurrency } = useIntl();

  // Fallback for currency formatting
  const formatCurrencySafe = (value: number) => {
    try {
      return formatCurrency ? formatCurrency(value) : `${value} SEK`;
    } catch (error) {
      return `${value} SEK`;
    }
  };
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Initialize filter persistence
  const { getSavedFilters, saveFilters } = useFilterPersistence();
  const savedFilters = getSavedFilters();
  
  const [statusFilter, setStatusFilter] = useState<string>(savedFilters.statusFilter || 'all');
  const [branchFilter, setBranchFilter] = useState<string>(savedFilters.branchFilter || 'all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Save filters when they change
  useEffect(() => {
    saveFilters({ statusFilter, branchFilter });
  }, [statusFilter, branchFilter, saveFilters]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // Fetch branches and customers for filtering
  useEffect(() => {
    const fetchData = async () => {
      try {
        logger.debug('AllReports Debug - Starting data fetch...');
        logger.debug('AllReports Debug - Current user:', currentUser);
        logger.debug('AllReports Debug - Permission level:', currentUser?.permissionLevel);
        logger.debug('AllReports Debug - Role:', currentUser?.role);

        const { getBranches, getBranch } = await import('../../services/branchService');
        const { getCustomers } = await import('../../services/customerService');

        logger.debug('AllReports Debug - Fetching branches...');
        let branchesData = await getBranches(currentUser || undefined);
        logger.debug('AllReports Debug - Branches fetched:', branchesData.length);

        // If no branches were fetched (permission issue), try to get the current user's branch
        if (branchesData.length === 0 && currentUser?.branchId) {
          logger.debug('AllReports Debug - No branches fetched, trying to get current user branch...');
          try {
            const currentBranch = await getBranch(currentUser.branchId);
            if (currentBranch) {
              branchesData = [currentBranch];
              logger.debug('AllReports Debug - Current user branch fetched:', currentBranch.name);
            }
          } catch (branchError) {
            logger.debug('AllReports Debug - Could not fetch current user branch:', branchError);
            // Create a fallback branch object
            const fallbackBranch: Branch = {
              id: currentUser.branchId,
              name: currentUser.branchId === 'stockholm' ? 'Stockholm' : 
                    currentUser.branchId === 'goteborg' ? 'Göteborg' :
                    currentUser.branchId === 'malmo' ? 'Malmö' :
                    currentUser.branchId.charAt(0).toUpperCase() + currentUser.branchId.slice(1),
              address: '',
              phone: '',
              email: '',
              isActive: true,
              country: 'Sweden',
              createdAt: new Date().toISOString()
            };
            branchesData = [fallbackBranch];
            logger.debug('AllReports Debug - Using fallback branch:', fallbackBranch.name);
          }
        }

        logger.debug('AllReports Debug - Fetching customers...');
        // Super admins see all customers, branch admins see only their branch customers
        const branchId = currentUser?.role === 'superadmin' ? undefined : currentUser?.branchId;
        const customersData = await getCustomers(branchId);
        logger.debug('AllReports Debug - Customers fetched:', customersData.length);

        setBranches(branchesData);
        setCustomers(customersData);

        logger.debug('AllReports Debug - Data fetch completed successfully');
      } catch (error) {
        logger.error('AllReports Debug - Error fetching data:', error);
        logger.error('AllReports Debug - Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown',
        });
      }
    };

    if (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'branchAdmin' || currentUser.role === 'inspector')) {
      logger.debug('AllReports Debug - User has appropriate permissions, fetching data...');
      fetchData();
    } else {
      logger.debug('AllReports Debug - User does not have appropriate permissions, role:', currentUser?.role);
    }
  }, [currentUser]);

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    const filtered = reports.filter(report => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

      // Branch filter - for branch admins, only show their branch's reports
      let matchesBranch = true;
      if (currentUser?.role === 'branchAdmin' && currentUser?.branchId) {
        matchesBranch = report.branchId === currentUser.branchId;
      } else if (currentUser?.role === 'superadmin') {
        matchesBranch = branchFilter === 'all' || report.branchId === branchFilter;
      }

      return matchesSearch && matchesStatus && matchesBranch;
    });

    // Sort reports - create a copy to avoid mutating the original array
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'estimatedCost':
          // Calculate estimated cost from recommended actions
          aValue = a.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0;
          bValue = b.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [reports, searchTerm, statusFilter, branchFilter, sortBy, sortOrder]);

  // Get branch name by ID
  const getBranchName = (branchId: string) => {
    if (!branchId) return 'No Branch';

    // If we have the current user's branch and it matches, try to get name from branches array
    if (currentUser?.branchId === branchId) {
      const userBranch = branches.find(b => b.id === currentUser.branchId);
      if (userBranch) {
        return userBranch.name;
      }
    }

    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      // If we have a branchId but no branch found, try to get it from current user
      if (currentUser?.branchId === branchId) {
        // Fallback to a default name based on branchId
        return branchId === 'stockholm' ? 'Stockholm' : 
               branchId === 'goteborg' ? 'Göteborg' :
               branchId === 'malmo' ? 'Malmö' :
               branchId.charAt(0).toUpperCase() + branchId.slice(1);
      }
      return `Branch ${branchId.slice(0, 8)}...`;
    }
    return branch.name;
  };

  // Handle report actions
  const handleViewReport = (report: Report) => {
    // Navigate to the report view page
    navigate(`/report/view/${report.id}`);
  };

  const handleEditReport = (report: Report) => {
    // Navigate to edit page
    navigate(`/report/edit/${report.id}`);
  };

  const handleDeleteReport = (report: Report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const confirmDeleteReport = async () => {
    if (reportToDelete) {
      setIsDeleting(true);
      try {
        await deleteReport(reportToDelete.id, reportToDelete.branchId);
        setShowDeleteModal(false);
        setReportToDelete(null);
        // Refresh the reports list
        await fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        const message = (error as any)?.message || 'Failed to delete report. Please try again.';
        alert(`Failed to delete report: ${message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Bulk export functionality
  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReports.size === filteredAndSortedReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredAndSortedReports.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const selectedReportsData = filteredAndSortedReports.filter(r => selectedReports.has(r.id));
      
      // Delete each report
      for (const report of selectedReportsData) {
        try {
          await deleteReport(report.id, report.branchId);
        } catch (error) {
          console.error(`Error deleting report ${report.id}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Clear selection
      setSelectedReports(new Set());

      // Ensure data is fresh across pages after bulk ops
      await fetchReports();

      // Show success message
      alert(`Successfully deleted ${selectedReportsData.length} report(s)`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Some reports could not be deleted. Please try again.');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const confirmBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  // Auto-refresh on focus/visibility to prevent stale counts when returning
  useEffect(() => {
    const onFocus = () => {
      fetchReports();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchReports();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchReports]);

  // Add cleanup functions to window for easy access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cleanupTempReports = cleanupTempReports;
      (window as any).debugUserAccount = debugUserAccount;
      (window as any).findLinusHollberg = findLinusHollberg;
      
      logger.debug('Debug functions available:');
      logger.debug('  - cleanupTempReports() - Delete only temp_ reports (safer)');
      logger.debug('  - debugUserAccount() - Investigate current user account');
      logger.debug('  - findLinusHollberg() - Search specifically for Linus Hollberg');
    }
  }, []);

  const handleBulkExport = async () => {
    if (selectedReports.size === 0) return;

    setIsBulkExporting(true);
    try {
      const selectedReportsData = filteredAndSortedReports.filter(r => selectedReports.has(r.id));

      for (const report of selectedReportsData) {
        try {
          const pdfBlob = await exportToPDF(report.id);
          // Create a temporary link to download the PDF
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          // Safe date formatting for filename
          const safeDate = (() => {
            try {
              const date = new Date(report.inspectionDate);
              if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
              }
              return date.toISOString().split('T')[0];
            } catch {
              return new Date().toISOString().split('T')[0];
            }
          })();
          link.download = `roof-inspection-${report.customerName.replace(/\s+/g, '-').toLowerCase()}-${safeDate}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Small delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error exporting report ${report.id}:`, error);
        }
      }

      setSelectedReports(new Set());
    } catch (error) {
      console.error('Bulk export error:', error);
    } finally {
      setIsBulkExporting(false);
    }
  };


  // Use centralized date formatter
  const formatDate = (date: any) => {
    return formatSwedishDate(date);
  };

  // Currency formatting is now handled by useIntl hook

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'shared':
        return 'bg-purple-100 text-purple-800';
      case 'offer_sent':
        return 'bg-purple-100 text-purple-800';
      case 'offer_accepted':
        return 'bg-green-100 text-green-800';
      case 'offer_rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_expired':
        return 'bg-orange-100 text-orange-800';
      case 'archived':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Debug logging for component state (only in development)
  logger.debug('AllReports Debug - Component render state:');
  logger.debug('AllReports Debug - Current user:', currentUser);
  logger.debug('AllReports Debug - Permission level:', currentUser?.permissionLevel);
  logger.debug('AllReports Debug - Role:', currentUser?.role);
  logger.debug('AllReports Debug - Reports count:', reports.length);
  logger.debug('AllReports Debug - Loading:', loading);
  logger.debug('AllReports Debug - Error:', error);
  logger.debug('AllReports Debug - Branches count:', branches.length);
  logger.debug('AllReports Debug - Customers count:', customers.length);

  // Additional debug logging
  if (currentUser) {
    logger.debug('AllReports Debug - User details:');
    logger.debug('  - UID:', currentUser.uid);
    logger.debug('  - Email:', currentUser.email);
    logger.debug('  - Role:', currentUser.role);
    logger.debug('  - Permission Level:', currentUser.permissionLevel);
    logger.debug('  - Branch ID:', currentUser.branchId);
    logger.debug('  - Branch IDs:', currentUser.branchIds);
  } else {
    logger.debug('AllReports Debug - No current user!');
  }

  if (reports.length > 0) {
    logger.debug('AllReports Debug - Sample report:', reports[0]);
  } else {
    logger.debug('AllReports Debug - No reports in state');
  }

  // Allow super admins, branch admins, and inspectors to access reports
  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'branchAdmin' && currentUser.role !== 'inspector')) {
    logger.debug('AllReports Debug - Access denied, showing access denied screen');
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-6xl mb-4'>🚫</div>
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>{t('errors.access.denied')}</h2>
          <p className='text-slate-600'>{t('errors.access.deniedMessage')}</p>
          <p className='text-sm text-slate-500 mt-2'>
            Current role: {currentUser?.role || 'No role'}
          </p>
          <div className='mt-4 p-4 bg-slate-100 rounded text-left text-xs'>
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>User: {currentUser?.email || 'No user'}</p>
            <p>Role: {currentUser?.role || 'No role'}</p>
            <p>Permission Level: {currentUser?.permissionLevel || 'No permission level'}</p>
            <p>UID: {currentUser?.uid || 'No UID'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-material'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Material Design Header */}
        <div className='mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
                {currentUser?.role === 'branchAdmin'
                  ? t('reports.branchReports')
                  : currentUser?.role === 'inspector'
                  ? t('navigation.myReports')
                  : t('reports.title')}
              </h1>
              <p className='mt-2 text-slate-600'>
                {currentUser?.role === 'branchAdmin'
                  ? `${t('reports.subtitle')} (${filteredAndSortedReports.length} total)`
                  : currentUser?.role === 'inspector'
                  ? `${t('reports.subtitle')} (${filteredAndSortedReports.length} total)`
                  : `${t('reports.subtitle')} (${filteredAndSortedReports.length} total)`}
              </p>
            </div>
            <div className='flex flex-wrap gap-3 items-center justify-end'>
              {selectedReports.size > 0 && (
                <div className='flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200'>
                  <span className='text-sm font-medium text-slate-900'>
                    {selectedReports.size} selected
                  </span>
                  <button
                    onClick={handleBulkExport}
                    disabled={isBulkExporting}
                    className='inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 shadow-sm'
                  >
                    {isBulkExporting ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className='h-4 w-4 mr-2' />
                        Export Selected
                      </>
                    )}
                  </button>
                  <button
                    onClick={confirmBulkDelete}
                    disabled={isBulkDeleting}
                    className='inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 shadow-sm'
                  >
                    {isBulkDeleting ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete Selected
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedReports(new Set())}
                    className='text-slate-700 hover:text-slate-900 text-sm font-medium'
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className='inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm'
              >
                <User className='h-4 w-4 mr-2' />
{showCustomerSearch ? t('customer.hideSearch') : t('customer.search')}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm'
              >
                <Filter className='h-4 w-4 mr-2' />
                {showFilters ? t('reports.hideFilters') : t('reports.showFilters')}
              </button>

              {/* Compact Tools dropdown */}
              <div className='relative'>
                <button
                  onClick={() => setShowToolsMenu(prev => !prev)}
                  className='inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm'
                >
                  {t('reports.tools') || 'Tools'}
                  <ChevronDown className='h-4 w-4 ml-2 text-slate-500' />
                </button>
                {showToolsMenu && (
                  <div className='absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10'>
                    <button
                      onClick={async () => {
                        setShowToolsMenu(false);
                        const confirmMessage = t('reports.confirmCleanTemp') || 'Delete ONLY temporary reports (IDs starting with temp_)? This is safe and only removes incomplete drafts.';
                        if (confirm(confirmMessage)) {
                          await cleanupTempReports();
                          await fetchReports();
                        }
                      }}
                      className='w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700'
                    >
                      {t('reports.cleanTempReports') || 'Clean temporary reports (temp_)'}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => fetchReports()}
                className='inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 shadow-sm'
              >
                {t('reports.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className='mb-6'>
          <div className='flex flex-wrap gap-2'>
            {[
              { label: t('reports.filters.allReports'), status: 'all', icon: FileText, count: reports.length },
              {
                label: t('reports.filters.draft'),
                status: 'draft',
                icon: Clock,
                count: reports.filter(r => r.status === 'draft').length,
              },
              {
                label: t('reports.filters.completed'),
                status: 'completed',
                icon: CheckSquare,
                count: reports.filter(r => r.status === 'completed').length,
              },
              {
                label: t('reports.filters.sent'),
                status: 'sent',
                icon: FileText,
                count: reports.filter(r => r.status === 'sent').length,
              },
              {
                label: t('reports.filters.offerSent'),
                status: 'offer_sent',
                icon: DollarSign,
                count: reports.filter(r => r.status === 'offer_sent').length,
              },
              {
                label: t('reports.filters.offerAccepted'),
                status: 'offer_accepted',
                icon: CheckSquare,
                count: reports.filter(r => r.status === 'offer_accepted').length,
              },
              {
                label: t('reports.filters.offerRejected'),
                status: 'offer_rejected',
                icon: CheckSquare,
                count: reports.filter(r => r.status === 'offer_rejected').length,
              },
              {
                label: t('reports.filters.offerExpired'),
                status: 'offer_expired',
                icon: CheckSquare,
                count: reports.filter(r => r.status === 'offer_expired').length,
              },
              {
                label: t('reports.filters.archived'),
                status: 'archived',
                icon: FileText,
                count: reports.filter(r => r.status === 'archived').length,
              },
            ].map(item => {
              const isActive = statusFilter === item.status;
              return (
                <button
                  key={item.status}
                  onClick={() => setStatusFilter(item.status)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                    isActive
                      ? 'bg-slate-200 text-slate-900 border-2 border-slate-300'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className='w-4 h-4 mr-2' />
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-slate-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Search */}
        {showCustomerSearch && (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
<h3 className='text-lg font-semibold text-slate-900 mb-4'>{t('customer.search')}</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {customers.map(customer => (
                <div
                  key={customer.id}
                  className='bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='font-semibold text-slate-900'>{customer.name}</h4>
                    <span className='text-sm text-slate-500'>{customer.totalReports} reports</span>
                  </div>
                  <div className='space-y-1 text-sm text-slate-600'>
                    {customer.email && <p>📧 {customer.email}</p>}
                    {customer.phone && <p>📞 {customer.phone}</p>}
                    {customer.address && <p>📍 {customer.address}</p>}
                    <p className='font-semibold text-slate-900'>
                      SEK {customer.totalRevenue?.toLocaleString('en-US') || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {customers.length === 0 && (
              <p className='text-slate-500 text-center py-4'>
{t('customer.noCustomersMessage')}
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Search */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Search</label>
                <div className='relative'>
                  <Search className='h-5 w-5 absolute left-3 top-3 text-slate-400' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder='Search reports...'
                    className='pl-10 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
<label className='block text-sm font-medium text-slate-700 mb-2'>{t('dashboard.status')}</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                >
                  <option value='all'>{t('reports.filters.allReports')}</option>
                  <option value='draft'>{t('reports.filters.draft')}</option>
                  <option value='completed'>{t('reports.filters.completed')}</option>
                  <option value='sent'>{t('reports.filters.sent')}</option>
                  <option value='offer_sent'>{t('reports.filters.offerSent')}</option>
                  <option value='offer_accepted'>{t('reports.filters.offerAccepted')}</option>
                  <option value='offer_rejected'>{t('reports.filters.offerRejected')}</option>
                  <option value='offer_expired'>{t('reports.filters.offerExpired')}</option>
                  <option value='archived'>{t('reports.filters.archived')}</option>
                </select>
              </div>

              {/* Branch Filter - Only show for super admins */}
              {currentUser?.role === 'superadmin' && (
                <div>
<label className='block text-sm font-medium text-slate-700 mb-2'>{t('navigation.branches')}</label>
                  <select
                    value={branchFilter}
                    onChange={e => setBranchFilter(e.target.value)}
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  >
<option value='all'>{t('reports.allBranches')}</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Sort By</label>
                <div className='flex space-x-2'>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm'
                  >
<option value='createdAt'>{t('customer.created')}</option>
                    <option value='customerName'>{t('customer.name')}</option>
                    <option value='estimatedCost'>{t('dashboard.revenue')}</option>
                    <option value='status'>{t('dashboard.status')}</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className='px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm text-sm font-medium text-slate-700 bg-white'
                  >
                    {sortOrder === 'asc' ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-slate-600'>Loading reports...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-6'>
            <div className='flex'>
              <div className='text-red-400'>
                <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Error loading reports</h3>
                <p className='mt-1 text-sm text-red-700'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        {!loading && !error && (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
            {filteredAndSortedReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
                  ? t('reports.noReportsFound')
                  : t('reports.noReports')}
                description={searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
                  ? t('reports.tryAdjustingFilters')
                  : t('reports.noReportsMessage')}
                actionLabel={searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
                  ? undefined
                  : t('reports.newReport')}
                onAction={searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
                  ? undefined
                  : () => navigate('/report/new')}
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className='hidden lg:block overflow-x-auto'>
                  <table className='min-w-full divide-y divide-slate-200'>
                    <thead className='bg-slate-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12'>
                          <button
                            onClick={handleSelectAll}
                            className='flex items-center justify-center'
                          >
                            {selectedReports.size === filteredAndSortedReports.length &&
                            filteredAndSortedReports.length > 0 ? (
                              <CheckSquare className='h-4 w-4 text-blue-600' />
                            ) : (
                              <Square className='h-4 w-4 text-slate-400' />
                            )}
                          </button>
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[200px]'>
                          {t('customer.name')}
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[150px]'>
                          {t('navigation.branches')}
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[100px]'>
                          {t('dashboard.status')}
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]'>
                          {t('dashboard.revenue')}
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]'>
                          {t('customer.created')}
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[200px]'>
                          {t('reports.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {filteredAndSortedReports.map(report => (
                        <tr key={report.id} className='hover:bg-slate-50'>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <button
                              onClick={() => handleSelectReport(report.id)}
                              className='flex items-center justify-center'
                            >
                              {selectedReports.has(report.id) ? (
                                <CheckSquare className='h-4 w-4 text-blue-600' />
                              ) : (
                                <Square className='h-4 w-4 text-slate-400' />
                              )}
                            </button>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <div>
                              <div className='text-sm font-medium text-slate-900'>
                                <div className="flex items-center gap-2">
                                  <span>{report.customerName || 'Unknown Customer'}</span>
                                  {report.customerType === 'company' && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                      Företag
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className='text-sm text-slate-500'>
                                {report.customerEmail || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <Building className='h-4 w-4 text-slate-400 mr-2 flex-shrink-0' />
                              <span className='text-sm text-slate-900 truncate'>
                                {getBranchName(report.branchId || '')}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status || 'draft')}`}
                            >
                              {report.status || 'draft'}
                            </span>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <DollarSign className='h-4 w-4 text-slate-400 mr-1 flex-shrink-0' />
                              <span className='text-sm font-medium text-slate-900'>
                                {formatCurrencySafe(report.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0)}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <Calendar className='h-4 w-4 text-slate-400 mr-2 flex-shrink-0' />
                              <span className='text-sm text-slate-900'>
                                {formatDate(report.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap text-sm font-medium'>
                            <div className='flex space-x-1'>
                              <Tooltip content='View Report Details'>
                                <button
                                  onClick={() => handleViewReport(report)}
                                  className='text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 min-w-[40px] min-h-[40px] flex items-center justify-center'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                              </Tooltip>
                              <Tooltip content='Edit Report'>
                                <button
                                  onClick={() => handleEditReport(report)}
                                  className='text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50 min-w-[40px] min-h-[40px] flex items-center justify-center'
                                >
                                  <Pencil className='h-4 w-4' />
                                </button>
                              </Tooltip>
                              <Tooltip content='Delete Report'>
                                <button
                                  onClick={() => handleDeleteReport(report)}
                                  className='text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className='lg:hidden'>
                  {filteredAndSortedReports.map(report => (
                    <div key={report.id} className='border-b border-slate-200 p-4 hover:bg-slate-50'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center'>
                          <button
                            onClick={() => handleSelectReport(report.id)}
                            className='mr-3'
                          >
                            {selectedReports.has(report.id) ? (
                              <CheckSquare className='h-5 w-5 text-blue-600' />
                            ) : (
                              <Square className='h-5 w-5 text-gray-400' />
                            )}
                          </button>
                          <div>
                            <h3 className='text-sm font-medium text-gray-900'>
                              {report.customerName || 'Unknown Customer'}
                            </h3>
                            <p className='text-sm text-gray-500'>
                              {report.customerEmail || 'No email'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status || 'draft')}`}
                        >
                          {report.status || 'draft'}
                        </span>
                      </div>
                      
                      <div className='grid grid-cols-2 gap-4 mb-3 text-sm'>
                        <div className='flex items-center'>
                          <Building className='h-4 w-4 text-gray-400 mr-2' />
                          <span className='text-gray-900 truncate'>
                            {getBranchName(report.branchId || '')}
                          </span>
                        </div>
                        <div className='flex items-center'>
                          <DollarSign className='h-4 w-4 text-gray-400 mr-2' />
                          <span className='text-gray-900'>
                            {formatCurrencySafe(report.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0)}
                          </span>
                        </div>
                        <div className='flex items-center'>
                          <Calendar className='h-4 w-4 text-gray-400 mr-2' />
                          <span className='text-gray-900'>
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className='flex space-x-2'>
                        <Tooltip content='View Report Details'>
                          <button
                            onClick={() => handleViewReport(report)}
                            className='text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50'
                          >
                            <Eye className='h-4 w-4' />
                          </button>
                        </Tooltip>
                        <Tooltip content='Edit Report'>
                          <button
                            onClick={() => handleEditReport(report)}
                            className='text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50'
                          >
                            <Pencil className='h-4 w-4' />
                          </button>
                        </Tooltip>
                        <Tooltip content='Delete Report'>
                          <button
                            onClick={() => handleDeleteReport(report)}
                            className='text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteReport}
          title={t('common.delete')}
          message={t('common.deleteReportConfirmation', { customerName: reportToDelete?.customerName })}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type='danger'
          icon='trash'
          isLoading={isDeleting}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          title={t('common.delete')}
          message={t('common.deleteSelectedReportsConfirmation', { count: selectedReports.size })}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type='danger'
          icon='trash'
          isLoading={isBulkDeleting}
        />

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className='fixed inset-0 bg-slate-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-slate-900'>
                  Report Details - {selectedReport.customerName}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className='text-slate-400 hover:text-slate-600'
                >
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-medium text-slate-900 mb-2'>Customer Information</h4>
                  <div className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>Name:</span> {selectedReport.customerName}
                    </p>
                    <p>
                      <span className='font-medium'>Email:</span> {selectedReport.customerEmail}
                    </p>
                    <p>
                      <span className='font-medium'>Phone:</span> {selectedReport.customerPhone}
                    </p>
                    <p>
                      <span className='font-medium'>Address:</span> {selectedReport.customerAddress}
                      {selectedReport.customerType === 'company' && selectedReport.buildingAddress && (
                        <div className='mt-1'>
                          <span className='font-medium'>Byggnadsadress:</span> {selectedReport.buildingAddress}
                        </div>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className='font-medium text-slate-900 mb-2'>Report Information</h4>
                  <div className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReport.status || 'draft')}`}
                      >
                        {selectedReport.status}
                      </span>
                    </p>
                    <p>
                      <span className='font-medium'>Branch:</span>{' '}
                      {getBranchName(selectedReport.branchId || '')}
                    </p>
                    <p>
                      <span className='font-medium'>Revenue:</span>{' '}
                      {formatCurrencySafe(selectedReport.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0)}
                    </p>
                    <p>
                      <span className='font-medium'>Created:</span>{' '}
                      {formatDate(selectedReport.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedReport.issuesFound && selectedReport.issuesFound.length > 0 && (
                <div className='mt-6'>
                  <h4 className='font-medium text-slate-900 mb-2'>Issues Found</h4>
                  <div className='space-y-2'>
                    {selectedReport.issuesFound.map((issue, index) => (
                      <div key={index} className='p-3 bg-slate-50 rounded-lg'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='font-medium text-sm'>{issue.description}</p>
                            <p className='text-xs text-slate-500 mt-1'>{issue.location}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              issue.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : issue.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  onClick={() => setSelectedReport(null)}
                  className='px-4 py-2 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllReports;
