import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportContextSimple';
import { useOptimizedStore, useComputedValues, useDataActions } from '../stores/optimizedStore';
import { cacheService } from '../services/cachingService';
import { useIntl } from '../hooks/useIntl';
import SmartDashboard from './dashboards/SmartDashboard';
import {
  FileText,
  Plus,
  Calendar,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  Search,
  Filter,
  X,
  Send,
  DollarSign,
  Settings,
} from 'lucide-react';
import LoadingSpinner, { LoadingCard, LoadingTable } from './common/LoadingSpinner';
import { SkeletonDashboard } from './common/SkeletonLoader';
import * as branchService from '../services/branchService';
import EmailStatusDashboard from './email/EmailStatusDashboard';
import AgritectumLogo from './AgritectumLogo';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, fetchReports } = useReports();
  const { t, formatCurrency } = useIntl();

  // Use Smart Dashboard for all roles - COMPLETE IMPLEMENTATION
  return <SmartDashboard />;
};

const OriginalDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, fetchReports } = useReports();
  const { t, formatCurrency } = useIntl();

  // Fallback for currency formatting
  const formatCurrencySafe = (value: number) => {
    try {
      return formatCurrency ? formatCurrency(value) : `${value} SEK`;
    } catch (error) {
      return `${value} SEK`;
    }
  };

  // Use optimized state management
  const dataState = useOptimizedStore(state => state.data);
  const computedValues = useComputedValues();
  const dataActions = useDataActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchReports();

      // Load branch information for branch admins and inspectors
      if (currentUser.branchId) {
        loadBranchInfo(currentUser.branchId);
      }
    }
  }, [currentUser]);

  const loadBranchInfo = useCallback(async (branchId: string) => {
    try {
      const branch = await branchService.getBranchById(branchId);

      if (branch) {
        const branchData = {
          name: branch.name,
          logoUrl: branch.logoUrl,
        };
        setBranchInfo(branchData);
      }
    } catch (error) {
      console.error('Error loading branch info:', error);
    }
  }, []);

  // Calculate stats from reports using the working state
  const stats = useMemo(() => {
    const reports = state.reports || [];
    return {
      total: reports.length,
      draft: reports.filter(r => r.status === 'draft').length,
      completed: reports.filter(r => r.status === 'completed').length,
      sent: reports.filter(r => r.status === 'sent').length,
      offers: reports.filter(r => r.isOffer || r.status.startsWith('offer_')).length,
      offersSent: reports.filter(r => r.status === 'offer_sent').length,
      offersAccepted: reports.filter(r => r.status === 'offer_accepted').length,
      offersRejected: reports.filter(r => r.status === 'offer_rejected').length,
      archived: reports.filter(r => r.status === 'archived').length,
    };
  }, [state.reports]);

  // Sync data to optimized state
  useEffect(() => {
    if (state.reports && state.reports.length > 0) {
      dataActions.setReports(state.reports);
    }
  }, [state.reports, dataActions]);


  // Ensure fresh data when user focuses or returns to dashboard
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

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  }, [t]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className='w-4 h-4 text-orange-500' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'sent':
        return <CheckCircle className='w-4 h-4 text-blue-500' />;
      case 'offer_sent':
        return <Send className='w-4 h-4 text-purple-500' />;
      case 'offer_accepted':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'offer_rejected':
        return <X className='w-4 h-4 text-red-500' />;
      case 'offer_expired':
        return <Clock className='w-4 h-4 text-gray-500' />;
      case 'archived':
        return <Archive className='w-4 h-4 text-gray-500' />;
      default:
        return <FileText className='w-4 h-4 text-gray-500' />;
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-orange-100 text-orange-800';
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
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and search reports
  const filteredReports = useMemo(() => {
    let filtered = state.reports || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        report =>
          report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.createdByName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    return filtered;
  }, [state.reports, searchTerm, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const StatCard = React.memo(
    ({
      icon: Icon,
      label,
      value,
      color,
    }: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      value: string | number;
      color: string;
    }) => (
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <div className='flex items-center'>
          <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
            <Icon className='w-6 h-6 text-white' />
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>{label}</p>
            <p className='text-2xl font-semibold text-gray-900'>{value}</p>
          </div>
        </div>
      </div>
    )
  );

  if (state.loading && state.reports.length === 0) {
    return <SkeletonDashboard />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center space-x-4'>
            {/* Branch Logo */}
            <div className='flex-shrink-0'>
              {branchInfo?.logoUrl ? (
                <img
                  src={branchInfo.logoUrl}
                  alt={`${branchInfo.name} logo`}
                  className='w-16 h-16 object-contain rounded-lg border border-gray-300 bg-white p-1'
                  onError={e => {
                    console.error('Error loading branch logo:', e);
                    e.currentTarget.style.display = 'none';
                    // Show fallback logo
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-logo');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              {(!branchInfo?.logoUrl || branchInfo.logoUrl === '') && (
                <div className='fallback-logo flex items-center justify-center w-16 h-16'>
                  <AgritectumLogo size="sm" showText={false} />
                </div>
              )}
            </div>

            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {getGreeting()}, {currentUser?.displayName || currentUser?.email}
              </h1>
              <p className='text-gray-600 capitalize'>
                {currentUser?.role} Dashboard
                {branchInfo && (
                  <span className='ml-2 text-blue-600 font-medium'>• {branchInfo.name}</span>
                )}
                {!branchInfo && currentUser?.branchId && (
                  <span className='ml-2 text-gray-500 text-sm'>• Loading branch info...</span>
                )}
              </p>
            </div>
          </div>

          {(currentUser?.role === 'inspector' || currentUser?.role === 'branchAdmin') && (
            <Link
              to='/report/new'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              <Plus className='w-4 h-4 mr-2' />
              New Report
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(currentUser?.role === 'inspector' || currentUser?.role === 'branchAdmin') && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Quick Actions</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Link
              to='/report/new'
              className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group'
            >
              <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200'>
                <Plus className='w-5 h-5 text-blue-600' />
              </div>
              <div className='ml-3'>
                <div className='text-sm font-medium text-gray-900'>New Report</div>
                <div className='text-xs text-gray-500'>Create inspection report</div>
              </div>
            </Link>

            {currentUser?.role === 'branchAdmin' && (
              <Link
                to='/admin/customers'
                className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group'
              >
                <div className='flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200'>
                  <User className='w-5 h-5 text-green-600' />
                </div>
                <div className='ml-3'>
                  <div className='text-sm font-medium text-gray-900'>Add Customer</div>
                  <div className='text-xs text-gray-500'>Manage customer data</div>
                </div>
              </Link>
            )}

            <Link
              to='/admin/reports'
              className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group'
            >
              <div className='flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200'>
                <FileText className='w-5 h-5 text-purple-600' />
              </div>
              <div className='ml-3'>
                <div className='text-sm font-medium text-gray-900'>View All Reports</div>
                <div className='text-xs text-gray-500'>Browse all reports</div>
              </div>
            </Link>

            {currentUser?.role === 'branchAdmin' && (
              <Link
                to='/admin/users'
                className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors group'
              >
                <div className='flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200'>
                  <User className='w-5 h-5 text-orange-600' />
                </div>
                <div className='ml-3'>
                  <div className='text-sm font-medium text-gray-900'>Invite Inspector</div>
                  <div className='text-xs text-gray-500'>Manage team members</div>
                </div>
              </Link>
            )}

            {(currentUser?.role === 'branchAdmin' || currentUser?.role === 'superadmin') && (
              <Link
                to='/admin/testing'
                className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group'
              >
                <div className='flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200'>
                  <Settings className='w-5 h-5 text-purple-600' />
                </div>
                <div className='ml-3'>
                  <div className='text-sm font-medium text-gray-900'>Admin Testing</div>
                  <div className='text-xs text-gray-500'>Test email and system functionality</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Email Status Dashboard */}
      {currentUser?.role === 'superadmin' && (
        <div className='mb-6'>
          <EmailStatusDashboard />
        </div>
      )}

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          icon={FileText}
          label={t('dashboard.stats.totalReports')}
          value={stats.total}
          color='bg-blue-500'
        />
        <StatCard
          icon={Send}
          label={t('dashboard.stats.offersSent')}
          value={stats.offersSent}
          color='bg-purple-500'
        />
        <StatCard
          icon={CheckCircle}
          label={t('dashboard.stats.offersAccepted')}
          value={stats.offersAccepted}
          color='bg-green-500'
        />
        <StatCard
          icon={Clock}
          label={t('dashboard.stats.draftReports')}
          value={stats.draft}
          color='bg-orange-500'
        />
      </div>

      {/* Offline Reports Warning */}
      {state.reports.filter(r => r.offline).length > 0 && (
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <AlertTriangle className='w-5 h-5 text-orange-400' />
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-orange-800'>
                You have {state.reports.filter(r => r.offline).length} offline report(s) pending
                sync
              </h3>
              <p className='text-sm text-orange-700 mt-1'>
                These reports will be automatically synced when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-medium text-gray-900'>Offers</h2>
              {filteredReports.length !== state.reports.length && (
                <p className='text-sm text-gray-500 mt-1'>
                  Showing {filteredReports.length} of {state.reports.length} offers
                </p>
              )}
            </div>
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  placeholder={t('dashboard.searchReports')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <Filter className='h-4 w-4 mr-1' />
                {t('dashboard.filter')}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <div className='flex items-center space-x-4'>
                <div>
                  <label
                    htmlFor='status-filter'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Status
                  </label>
                  <select
                    id='status-filter'
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='draft'>Draft</option>
                    <option value='completed'>Completed</option>
                    <option value='sent'>Sent</option>
                    <option value='archived'>Archived</option>
                  </select>
                </div>
                {(searchTerm || statusFilter !== 'all') && (
                  <div className='flex items-end'>
                    <button
                      onClick={clearFilters}
                      className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      <X className='h-4 w-4 mr-1' />
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {state.reports.length === 0 ? (
          <div className='p-6 text-center'>
            <FileText className='w-12 h-12 text-gray-400 mx-auto' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No reports yet</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Get started by creating your first inspection report.
            </p>
            {(currentUser?.role === 'inspector' || currentUser?.role === 'branchAdmin') && (
              <div className='mt-6'>
                <Link
                  to='/report/new'
                  className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  New Report
                </Link>
              </div>
            )}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className='p-6 text-center'>
            <Search className='w-12 h-12 text-gray-400 mx-auto' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No reports found</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={clearFilters}
              className='mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <X className='h-4 w-4 mr-1' />
{t('actions.clear')} {t('dashboard.filter')}
            </button>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {filteredReports.slice(0, 10).map(report => (
              <Link
                key={report.id}
                to={`/report/view/${report.id}`}
                className='block hover:bg-gray-50 transition-colors'
              >
                <div className='px-6 py-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <div className='flex-shrink-0'>{getStatusIcon(report.status)}</div>
                      <div className='min-w-0 flex-1 ml-3'>
                        <div className='flex items-center space-x-2'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {report.customerName}
                          </p>
                          {report.isOffer && (
                            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                              <DollarSign className='w-3 h-3 mr-1' />
                              Offer
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-gray-500 truncate'>{report.customerAddress}</p>
                        <div className='flex items-center mt-1 space-x-4'>
                          <div className='flex items-center text-xs text-gray-500'>
                            <Calendar className='w-3 h-3 mr-1' />
                            {new Date(report.inspectionDate).toLocaleDateString('sv-SE', {
                              timeZone: 'Europe/Stockholm',
                            })}
                          </div>
                          <div className='flex items-center text-xs text-gray-500'>
                            <User className='w-3 h-3 mr-1' />
                            {report.createdByName}
                          </div>
                          {report.offerValue && (
                            <div className='flex items-center text-xs text-green-600 font-medium'>
                              <DollarSign className='w-3 h-3 mr-1' />
                              {formatCurrencySafe(report.offerValue)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-3'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status)}`}
                      >
                        {report.status === 'offer_sent'
                          ? t('report.status.offerSent')
                          : report.status === 'offer_accepted'
                            ? t('report.status.offerAccepted')
                            : report.status === 'offer_rejected'
                              ? t('report.status.offerRejected')
                              : report.status === 'offer_expired'
                                ? t('report.status.offerExpired')
                                : t(`report.status.${report.status}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
