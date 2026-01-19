/**
 * @legacy
 * @movedFrom src/components/OptimizedDashboard.tsx
 * @movedDate 2025-01-11
 * @reason Unused dashboard implementation - not imported anywhere
 * @deprecated Do not use in new code. Kept for reference only.
 * 
 * This component was moved to legacy on 2025-01-11 because:
 * - Not imported or used anywhere in the codebase
 * - SmartDashboard is the canonical dashboard implementation
 * - This appears to be an alternate implementation that was never integrated
 * 
 * Migration: Use SmartDashboard from src/components/dashboards/SmartDashboard.tsx
 * See src/legacy/ARCHIVE_MANIFEST.md for details
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { logger } from '../../utils/logger';
import {
  FileText,
  Plus,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  Archive,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
// import LoadingSpinner from '../common/LoadingSpinner';
import { SkeletonDashboard } from '../common/SkeletonLoader';
import * as branchService from '../../services/branchService';
import * as userService from '../../services/userService';

interface KPICardProps {
  label: string;
  value: number;
  trend?: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, trend, color, icon: Icon }) => (
  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
    <div className='flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-gray-600'>{label}</p>
        <p className='text-2xl font-bold text-gray-900'>{value}</p>
        {trend !== undefined && (
          <div
            className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {trend >= 0 ? (
              <TrendingUp className='w-4 h-4 mr-1' />
            ) : (
              <TrendingDown className='w-4 h-4 mr-1' />
            )}
            {Math.abs(trend)}% vs last week
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className='w-6 h-6 text-white' />
      </div>
    </div>
  </div>
);

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Icon className='w-4 h-4 mr-1.5' />
    {label}
  </button>
);

interface BranchContextProps {
  branchName: string;
  activeInspectors: number;
  reportsThisWeek: number;
  avgCompletionTime: number;
}

const BranchContext: React.FC<BranchContextProps> = ({
  branchName,
  activeInspectors,
  reportsThisWeek,
  avgCompletionTime,
}) => (
  <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6'>
    <div className='flex items-center justify-between'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 18
              ? 'afternoon'
              : 'evening'}
          , {branchName} Manager
        </h2>
        <p className='text-gray-600 mt-1'>Here's your branch performance overview</p>
      </div>
      <div className='flex space-x-6 text-sm'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>{activeInspectors}</div>
          <div className='text-gray-500'>Active Inspectors</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>{reportsThisWeek}</div>
          <div className='text-gray-500'>Reports This Week</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-purple-600'>{avgCompletionTime}</div>
          <div className='text-gray-500'>Avg. Completion (days)</div>
        </div>
      </div>
    </div>
  </div>
);

interface AnalyticsPreviewProps {
  reports: any[];
}

const AnalyticsPreview: React.FC<AnalyticsPreviewProps> = ({ reports }) => {
  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      count: reports.filter(report => report.inspectionDate?.startsWith(date)).length,
    }));
  }, [reports]);

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Reports This Week</h3>
        <Link
          to='/admin/analytics'
          className='text-sm text-blue-600 hover:text-blue-700 flex items-center'
        >
          View Full Analytics
          <BarChart3 className='w-4 h-4 ml-1' />
        </Link>
      </div>
      <div className='flex items-end space-x-2 h-20'>
        {weeklyData.map((day, _index) => (
          <div key={day.date} className='flex-1 flex flex-col items-center'>
            <div
              className='bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600'
              style={{
                height: `${Math.max(4, (day.count / Math.max(...weeklyData.map(d => d.count), 1)) * 60)}px`,
              }}
            />
            <div className='text-xs text-gray-500 mt-1'>
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className='text-xs font-medium text-gray-700'>{day.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OptimizedDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, fetchReports } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectorFilter, setInspectorFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [branchInfo, setBranchInfo] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [inspectors, setInspectors] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchReports();

      // Load branch information
      if (currentUser.branchId) {
        loadBranchInfo(currentUser.branchId);
      }

      // Load inspectors for filtering
      loadInspectors();
    }
  }, [currentUser, fetchReports]);

  const loadBranchInfo = async (branchId: string) => {
    try {
      const branch = await branchService.getBranch(branchId);
      if (branch) {
        setBranchInfo({ name: branch.name, logoUrl: branch.logoUrl });
      }
    } catch (error) {
      console.error('Error loading branch info:', error);
    }
  };

  const loadInspectors = async () => {
    try {
      const users = await userService.getUsers();
      const inspectorUsers = users.filter(user => user.role === 'inspector');
      setInspectors(inspectorUsers);
    } catch (error) {
      console.error('Error loading inspectors:', error);
    }
  };

  // Calculate KPIs with trends (mock data for now)
  const kpis = useMemo(() => {
    const reports = state.reports || [];
    const total = reports.length;
    const drafts = reports.filter(r => r.status === 'draft').length;
    const completed = reports.filter(r => r.status === 'completed').length;
    const archived = reports.filter(r => r.status === 'archived').length;
    const sent = reports.filter(r => r.status === 'sent' || r.status === 'offer_sent').length;

    return {
      total: { value: total, trend: 12 },
      drafts: { value: drafts, trend: -5 },
      completed: { value: completed, trend: 8 },
      sent: { value: sent, trend: 15 },
      archived: { value: archived, trend: 0 },
    };
  }, [state.reports]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = state.reports || [];

    if (searchTerm) {
      filtered = filtered.filter(
        report =>
          report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (inspectorFilter !== 'all') {
      filtered = filtered.filter(report => report.createdBy === inspectorFilter);
    }

    return filtered;
  }, [state.reports, searchTerm, statusFilter, inspectorFilter]);

  // Calculate branch context data
  const branchContext = useMemo(() => {
    const reports = state.reports || [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const reportsThisWeek = reports.filter(
      report => new Date(report.inspectionDate) >= oneWeekAgo
    ).length;

    const completedReports = reports.filter(r => r.status === 'completed');
    const avgCompletionTime =
      completedReports.length > 0
        ? Math.round(
            completedReports.reduce((acc, report) => {
              const created = new Date(report.createdAt || report.inspectionDate);
              const completed = new Date(report.lastEdited || report.inspectionDate);
              return acc + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / completedReports.length
          )
        : 0;

    return {
      activeInspectors: inspectors.length,
      reportsThisWeek,
      avgCompletionTime,
    };
  }, [state.reports, inspectors]);

  const handleQuickAction = (action: string, reportId: string) => {
    switch (action) {
      case 'view':
        window.open(`/report/view/${reportId}`, '_blank');
        break;
      case 'edit':
        window.location.href = `/report/edit/${reportId}`;
        break;
      case 'resend':
        // Implement resend logic
        logger.log('Resend report:', reportId);
        break;
      case 'export':
        // Implement export logic
        logger.log('Export report:', reportId);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'offer_sent':
        return 'bg-purple-100 text-purple-800';
      case 'offer_accepted':
        return 'bg-green-100 text-green-800';
      case 'offer_rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_expired':
        return 'bg-orange-100 text-orange-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (state.loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Branch Context */}
        {branchInfo && (
          <BranchContext
            branchName={branchInfo.name}
            activeInspectors={branchContext.activeInspectors}
            reportsThisWeek={branchContext.reportsThisWeek}
            avgCompletionTime={branchContext.avgCompletionTime}
          />
        )}

        {/* KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
          <KPICard
            label='Total Offers'
            value={kpis.total.value}
            trend={kpis.total.trend}
            color='bg-blue-500'
            icon={FileText}
          />
          <KPICard
            label='Draft Offers'
            value={kpis.drafts.value}
            trend={kpis.drafts.trend}
            color='bg-yellow-500'
            icon={Clock}
          />
          <KPICard
            label='Completed'
            value={kpis.completed.value}
            trend={kpis.completed.trend}
            color='bg-green-500'
            icon={CheckCircle}
          />
          <KPICard
            label='Sent'
            value={kpis.sent.value}
            trend={kpis.sent.trend}
            color='bg-purple-500'
            icon={Send}
          />
          <KPICard
            label='Archived'
            value={kpis.archived.value}
            trend={kpis.archived.trend}
            color='bg-gray-500'
            icon={Archive}
          />
        </div>

        {/* Analytics Preview */}
        <div className='mb-8'>
          <AnalyticsPreview reports={state.reports || []} />
        </div>

        {/* Reports Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-medium text-gray-900'>Recent Offers</h2>
              <div className='flex items-center space-x-3'>
                {/* Search */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='text'
                    placeholder='Search offers...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                >
                  <Filter className='w-4 h-4 mr-2' />
                  Filters
                </button>

                {/* New Report Button */}
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

            {/* Filters */}
            {showFilters && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='draft'>Draft</option>
                    <option value='completed'>Completed</option>
                    <option value='sent'>Sent</option>
                    <option value='offer_sent'>Offer Sent</option>
                    <option value='offer_accepted'>Offer Accepted</option>
                    <option value='offer_rejected'>Offer Rejected</option>
                    <option value='offer_expired'>Offer Expired</option>
                    <option value='archived'>Archived</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Inspector</label>
                  <select
                    value={inspectorFilter}
                    onChange={e => setInspectorFilter(e.target.value)}
                    className='block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>All Inspectors</option>
                    {inspectors.map(inspector => (
                      <option key={inspector.id} value={inspector.id}>
                        {inspector.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex items-end'>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setInspectorFilter('all');
                      setSearchTerm('');
                    }}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reports List */}
          <div className='divide-y divide-gray-200'>
            {filteredReports.length === 0 ? (
              <div className='text-center py-12'>
                <FileText className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>No offers found</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {searchTerm || statusFilter !== 'all' || inspectorFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating a new report'}
                </p>
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className='p-6 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex-shrink-0'>
                          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                            <Building className='w-5 h-5 text-blue-600' />
                          </div>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2'>
                            <h3 className='text-sm font-medium text-gray-900 truncate'>
                              {report.customerName}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                            >
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className='text-sm text-gray-500 truncate'>{report.customerAddress}</p>
                          <div className='flex items-center space-x-4 mt-1 text-xs text-gray-500'>
                            <span className='flex items-center'>
                              <Calendar className='w-3 h-3 mr-1' />
                              {new Date(report.inspectionDate).toLocaleDateString('sv-SE')}
                            </span>
                            {report.offerValue && (
                              <span className='flex items-center'>
                                <FileText className='w-3 h-3 mr-1' />
                                {report.offerValue.toLocaleString('sv-SE')} SEK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <QuickActionButton
                        icon={Eye}
                        label='View'
                        onClick={() => handleQuickAction('view', report.id)}
                      />
                      <QuickActionButton
                        icon={Edit}
                        label='Edit'
                        onClick={() => handleQuickAction('edit', report.id)}
                      />
                      <QuickActionButton
                        icon={Send}
                        label='Resend'
                        onClick={() => handleQuickAction('resend', report.id)}
                      />
                      <QuickActionButton
                        icon={Download}
                        label='Export'
                        onClick={() => handleQuickAction('export', report.id)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedDashboard;
