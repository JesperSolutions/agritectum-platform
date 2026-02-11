/**
 * Smart Dashboard Component - COMPLETE IMPLEMENTATION
 *
 * Unified dashboard that adapts based on user role.
 * Replaces SuperadminDashboard, BranchAdminDashboard, and InspectorDashboard.
 *
 * All data loading logic copied from original dashboards for full functionality.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import { getCurrencyCode, formatCurrency } from '../../utils/currency';
import {
  Building,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Globe,
  Target,
  Clock,
  Calendar,
  MapPin,
  User,
  FileCheck,
  TrendingUp,
  XCircle,
  Bell,
  Zap,
  Plus,
  Eye,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

// Types
interface BranchStats {
  id: string;
  name: string;
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  totalRevenue: number;
  activeUsers: number;
  completionRate: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  activeReports: number;
  completedThisWeek: number;
  lastActivity: string;
  status: 'active' | 'busy' | 'away' | 'inactive';
}

interface Task {
  id: string;
  title: string;
  customer: string;
  address: string;
  scheduledDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'inProgress' | 'completed';
  estimatedDuration: string;
}

const SmartDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { state, fetchReports } = useReports();
  const { t } = useIntl();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const welcomeToastShown = useRef(false);
  const loadAttempted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inspectorStats, setInspectorStats] = useState({
    scheduledThisWeek: 0,
    averageTime: 0,
    totalReports: 0,
  });
  // Branch Admin specific state
  const [serviceAgreements, setServiceAgreements] = useState<any[]>([]);
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rejectedOrders, setRejectedOrders] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser && !loadAttempted.current) {
      loadAttempted.current = true;
      loadDashboardData();

      // Show welcome toast once per session
      if (!welcomeToastShown.current) {
        const lastWelcomeTime = localStorage.getItem('lastWelcomeToast');
        const now = Date.now();
        // Show welcome toast if it's been more than 1 hour since last login
        if (!lastWelcomeTime || now - parseInt(lastWelcomeTime) > 3600000) {
          const welcomeMessage =
            currentUser?.role === 'branchAdmin'
              ? t('dashboard.welcomeBack', {
                  name: currentUser?.displayName || currentUser?.email || 'User',
                })
              : t('dashboard.welcomeBack', {
                  name: currentUser?.displayName || currentUser?.email || 'User',
                });
          showInfo(welcomeMessage);
          localStorage.setItem('lastWelcomeToast', now.toString());
        }
        welcomeToastShown.current = true;
      }
    }

    // Reset loadAttempted when user changes
    return () => {
      if (!currentUser) {
        loadAttempted.current = false;
      }
    };
  }, [currentUser?.uid, showInfo, t]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      switch (currentUser?.role) {
        case 'superadmin':
          await loadSuperadminData();
          break;
        case 'branchAdmin':
          await loadBranchAdminData();
          break;
        case 'inspector':
          await loadInspectorData();
          break;
      }
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperadminData = async () => {
    const { getBranches } = await import('../../services/branchService');
    const { getUsers } = await import('../../services/userService');
    const { getReports } = await import('../../services/reportService');

    const branches = await getBranches(currentUser || undefined);
    const reports = await getReports(currentUser!);
    const users = await getUsers();

    const branchStatsData: BranchStats[] = await Promise.all(
      branches.map(async branch => {
        const branchReports = reports.filter(report => report.branchId === branch.id);
        const branchUsers = users.filter(user => user.branchId === branch.id);

        const totalReports = branchReports.length;
        const completedReports = branchReports.filter(r => r.status === 'completed').length;
        const pendingReports = branchReports.filter(r => r.status === 'draft').length;
        const totalRevenue = branchReports.reduce(
          (sum, report) => sum + (report.offerValue || 0),
          0
        );
        const activeUsers = branchUsers.length;
        const completionRate =
          totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

        return {
          id: branch.id,
          name: branch.name,
          totalReports,
          completedReports,
          pendingReports,
          totalRevenue,
          activeUsers,
          completionRate,
        };
      })
    );

    setBranchStats(branchStatsData);
  };

  const loadBranchAdminData = async () => {
    const { getUsers } = await import('../../services/userService');
    const { getServiceAgreements } = await import('../../services/serviceAgreementService');
    const { getScheduledVisits } = await import('../../services/scheduledVisitService');
    const { getAppointments } = await import('../../services/appointmentService');
    const { getRejectedOrdersByBranch } = await import('../../services/rejectedOrderService');

    await fetchReports();

    const reports = state.reports || [];
    const branchReports = reports.filter(report => report.branchId === currentUser?.branchId);
    const users = await getUsers(currentUser?.branchId);

    // Load service agreements for this branch
    const agreements = await getServiceAgreements(currentUser?.branchId);
    setServiceAgreements(agreements);

    // Load scheduled visits for this branch
    if (currentUser) {
      try {
        const visits = await getScheduledVisits(currentUser);
        setScheduledVisits(visits);
      } catch (error: any) {
        logger.warn('⚠️ Could not load scheduled visits:', error.message);
        // Continue with empty list if there's a permission issue
        setScheduledVisits([]);
      }

      // Load appointments for this branch
      try {
        const apts = await getAppointments(currentUser);
        setAppointments(apts);
      } catch (error: any) {
        logger.warn('⚠️ Could not load appointments:', error.message);
        setAppointments([]);
      }

      // Load rejected orders for this branch
      if (currentUser.branchId) {
        try {
          const rejected = await getRejectedOrdersByBranch(currentUser.branchId);
          setRejectedOrders(rejected);
        } catch (error) {
          // Handle errors gracefully - service should return empty array, but catch just in case
          logger.warn('Could not load rejected orders:', error);
          setRejectedOrders([]);
        }
      }
    }

    const teamMembersData: TeamMember[] = users
      .filter(user => user.role !== 'customer') // Exclude customers from team view
      .map(user => {
        const userReports = branchReports.filter(report => report.createdBy === user.uid);
        const completedThisWeek = userReports.filter(report => {
          if (!report.lastEdited) return false;
          const reportDate = new Date(report.lastEdited);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return report.status === 'completed' && reportDate >= weekAgo;
        }).length;

        return {
          id: user.uid,
          name: user.displayName || user.email,
          role:
            user.role === 'inspector'
              ? t('dashboard.roles.inspector')
              : user.role === 'branchAdmin'
                ? t('dashboard.roles.branchAdmin')
                : t('dashboard.roles.user'),
          activeReports: userReports.filter(r => r.status === 'draft').length,
          completedThisWeek,
          lastActivity: user.lastLogin
            ? new Date(user.lastLogin).toLocaleString('sv-SE')
            : 'Aldrig',
          status: user.isActive ? 'active' : ('inactive' as const),
        };
      });

    setTeamMembers(teamMembersData);
  };

  const loadInspectorData = async () => {
    await fetchReports();
    const reports = state.reports || [];

    // Filter by inspector's UID, not inspectorId
    const inspectorReports = reports.filter(report => report.createdBy === currentUser?.uid);

    // Get appointments for this inspector
    const { getAppointments } = await import('../../services/appointmentService');
    const allAppointments = await getAppointments(currentUser!);
    const inspectorAppointments = allAppointments.filter(
      apt => apt.assignedInspectorId === currentUser?.uid
    );

    // Calculate scheduled this week
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const scheduledThisWeek = inspectorAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate);
      return aptDate >= weekStart && aptDate <= weekEnd;
    }).length;

    // Calculate average time from completed reports
    const completedReports = inspectorReports.filter(r => r.status === 'completed');
    const totalTime = completedReports.reduce((sum, r) => sum + (r.inspectionDuration || 0), 0);
    const avgTime =
      completedReports.length > 0 ? (totalTime / completedReports.length).toFixed(1) : '0';

    // Store in state for KPI calculation
    setInspectorStats({
      scheduledThisWeek,
      averageTime: parseFloat(avgTime),
      totalReports: inspectorReports.length,
    });

    // Map to tasks
    const tasksData: Task[] = inspectorReports.map(report => ({
      id: report.id,
      title: `Takinspektion - ${report.customerName}`,
      customer: report.customerName || 'Okänd kund',
      address: report.customerAddress || 'Ingen adress',
      scheduledDate: report.inspectionDate
        ? new Date(report.inspectionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      priority: report.status === 'draft' ? 'medium' : 'low',
      status:
        report.status === 'completed'
          ? 'completed'
          : report.status === 'draft'
            ? 'inProgress'
            : 'scheduled',
      estimatedDuration: '2 timmar',
    }));

    setTasks(tasksData);
  };

  // Calculate role-specific KPIs
  const calculateKPIs = () => {
    const reports = state.reports || [];

    if (currentUser?.role === 'superadmin') {
      const totalReports = reports.length;
      const completedReports = reports.filter(r => r.status === 'completed').length;
      const totalRevenue = reports.reduce((sum, r) => sum + (r.offerValue || 0), 0);
      const completionRate =
        totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
      const activeUsers = branchStats.reduce((sum, b) => sum + b.activeUsers, 0);
      const currencyCode = getCurrencyCode();

      return [
        {
          label: t('dashboard.totalReports'),
          value: totalReports,
          subtitle: t('dashboard.totalReportsDesc'),
          icon: FileText,
          iconColor: 'text-blue-600',
        },
        {
          label: t('dashboard.totalRevenue'),
          value: `${totalRevenue.toLocaleString('sv-SE')} ${currencyCode}`,
          subtitle: t('dashboard.offerValueDesc'),
          icon: DollarSign,
          iconColor: 'text-green-600',
        },
        {
          label: t('dashboard.completionRate'),
          value: `${completionRate}%`,
          subtitle: t('dashboard.completedReportsDesc'),
          icon: BarChart3,
          iconColor: 'text-purple-600',
        },
        {
          label: t('dashboard.activeUsers'),
          value: activeUsers,
          subtitle: t('dashboard.acrossAllBranches'),
          icon: Users,
          iconColor: 'text-orange-600',
        },
      ];
    }

    if (currentUser?.role === 'branchAdmin') {
      const branchReports = reports.filter(r => r.branchId === currentUser?.branchId);
      const totalReports = branchReports.length;
      const completedReports = branchReports.filter(r => r.status === 'completed').length;
      const pendingReports = branchReports.filter(r => r.status === 'draft').length;
      const completionRate =
        totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
      const teamProductivity = teamMembers.reduce((sum, m) => sum + m.completedThisWeek, 0);

      // Service Agreement metrics
      const activeServiceAgreements = serviceAgreements.filter(sa => sa.status === 'active');
      const serviceAgreementRevenue = activeServiceAgreements.reduce((sum, sa) => {
        // Calculate monthly revenue from service agreements
        // Use pricingStructure (perRoof or perSquareMeter) or fallback to price field
        let annualRevenue = 0;
        if (sa.pricingStructure?.perRoof) {
          annualRevenue = sa.pricingStructure.perRoof;
        } else if (sa.pricingStructure?.perSquareMeter && sa.buildingId) {
          // Would need building size, but for now use perSquareMeter * estimated 100m²
          annualRevenue = sa.pricingStructure.perSquareMeter * 100;
        } else if (sa.price) {
          // If billingFrequency is annual, price is already annual
          // If semi-annual, multiply by 2
          annualRevenue = sa.billingFrequency === 'semi-annual' ? sa.price * 2 : sa.price;
        }
        return sum + annualRevenue / 12; // Monthly revenue
      }, 0);

      // Scheduled Visits metrics
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingVisits = scheduledVisits.filter(v => {
        const visitDate = new Date(v.scheduledDate);
        return visitDate >= now && visitDate <= nextWeek && v.status === 'scheduled';
      }).length;
      const completedVisitsThisWeek = scheduledVisits.filter(v => {
        if (!v.completedAt) return false;
        const completedDate = new Date(v.completedAt);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return v.status === 'completed' && completedDate >= weekAgo;
      }).length;

      return [
        {
          label: t('dashboard.totalReports'),
          value: totalReports,
          subtitle: '+15% ' + t('dashboard.vsLastWeek'),
          icon: FileText,
          iconColor: 'text-blue-600',
        },
        {
          label: t('analytics.activeServiceAgreements'),
          value: activeServiceAgreements.length,
          subtitle: `${serviceAgreementRevenue.toLocaleString('sv-SE')} ${t('dashboard.serviceAgreements.sekPerMonthRecurring')}`,
          icon: FileCheck,
          iconColor: 'text-green-600',
        },
        {
          label: t('dashboard.scheduledVisits.title'),
          value: upcomingVisits,
          subtitle: `${completedVisitsThisWeek} ${t('dashboard.completedThisWeek')}`,
          icon: Calendar,
          iconColor: 'text-purple-600',
        },
        {
          label: t('dashboard.completionRate'),
          value: `${completionRate}%`,
          subtitle: t('dashboard.aboveTarget'),
          icon: CheckCircle,
          iconColor: 'text-orange-600',
        },
      ];
    }

    if (currentUser?.role === 'inspector') {
      const inspectorReports = reports.filter(r => r.createdBy === currentUser?.uid);
      const completedThisWeek = inspectorReports.filter(r => {
        if (!r.lastEdited) return false;
        const reportDate = new Date(r.lastEdited);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return r.status === 'completed' && reportDate >= weekAgo;
      }).length;

      return [
        {
          label: t('dashboard.completedThisWeek'),
          value: completedThisWeek,
          subtitle: t('dashboard.vsLastWeek'),
          icon: CheckCircle,
          iconColor: 'text-green-600',
        },
        {
          label: t('dashboard.scheduledThisWeek'),
          value: inspectorStats.scheduledThisWeek, // Use real data
          subtitle: t('dashboard.upcoming'),
          icon: Calendar,
          iconColor: 'text-blue-600',
        },
        {
          label: t('dashboard.averageTime'),
          value: inspectorStats.averageTime, // Use real data
          subtitle: t('dashboard.hours'),
          icon: Clock,
          iconColor: 'text-purple-600',
        },
        {
          label: t('dashboard.totalReports'),
          value: inspectorStats.totalReports, // Use real data
          subtitle: t('dashboard.allTime'),
          icon: FileText,
          iconColor: 'text-yellow-600',
        },
      ];
    }

    return [];
  };

  const getHeaderConfig = () => {
    switch (currentUser?.role) {
      case 'superadmin':
        return {
          color: 'from-blue-600 to-blue-800',
          title: t('dashboard.superadmin'),
          subtitle: `${t('dashboard.comprehensiveOverview')} - ${branchStats.length} ${t('dashboard.branches')}`,
          icon: Globe,
        };
      case 'branchAdmin':
        return {
          color: 'from-green-600 to-green-800',
          title: t('dashboard.branchAdmin'),
          subtitle: `${t('dashboard.branchOverview')} - ${currentUser?.branchId || 'Din filial'}`,
          icon: Building,
        };
      case 'inspector':
        return {
          color: 'from-purple-600 to-purple-800',
          title: t('dashboard.inspector'),
          subtitle: `${t('dashboard.personalWorkspace')} - ${currentUser?.displayName || t('dashboard.roles.inspector')}`,
          icon: Target,
        };
      default:
        return {
          color: 'from-gray-600 to-gray-800',
          title: 'Dashboard',
          subtitle: '',
          icon: Activity,
        };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const headerConfig = getHeaderConfig();
  const kpis = calculateKPIs();
  const todayTasks = tasks.filter(t => t.scheduledDate === new Date().toISOString().split('T')[0]);

  return (
    <div className='space-y-6 font-material max-w-7xl mx-auto'>
      {/* Material Design Header - Role-Specific Color */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl shadow-lg p-8 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-medium tracking-tight'>{headerConfig.title}</h1>
            <p className='text-white text-opacity-90 mt-2 text-base font-light'>
              {headerConfig.subtitle}
            </p>
          </div>
          <div className='flex items-center space-x-6'>
            <div className='text-right'>
              <p className='text-sm text-white text-opacity-75 font-light uppercase tracking-wide'>
                {t('dashboard.lastUpdated')}
              </p>
              <p className='text-lg font-medium mt-1'>{new Date().toLocaleDateString('sv-SE')}</p>
            </div>
            <headerConfig.icon className='w-10 h-10 text-white opacity-80' />
          </div>
        </div>
      </div>

      {/* Universal KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className='bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 transition-all hover:shadow-md'
          >
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <kpi.icon className={`w-5 h-5 text-slate-600`} />
                </div>
              </div>
              <div>
                <p className='text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 truncate'>
                  {kpi.label}
                </p>
                <p className='text-2xl md:text-3xl font-bold text-slate-900 mb-1 truncate'>
                  {kpi.value}
                </p>
                <p className='text-xs text-slate-500 font-light truncate'>{kpi.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inspector CTA - Create New Report */}
      {currentUser?.role === 'inspector' && (
        <div
          onClick={() => navigate('/report/new')}
          className='w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 rounded-2xl shadow-md p-8 text-white cursor-pointer hover:shadow-lg transition-all duration-300'
        >
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center gap-6'>
              <div className='w-16 h-16 bg-white bg-opacity-15 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm'>
                <Plus className='w-8 h-8' />
              </div>
              <div>
                <h2 className='text-2xl md:text-3xl font-semibold mb-2'>
                  {t('dashboard.quickActions.createReport') || 'Opret rapport'}
                </h2>
                <p className='text-base md:text-lg text-white text-opacity-85'>
                  {t('dashboard.recentReports.createFirst') || 'Opret din første rapport'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 bg-white bg-opacity-15 text-white px-6 py-3 rounded-xl border border-white border-opacity-20 shadow-sm'>
              <FileText className='w-6 h-6' />
              <span className='text-lg font-medium whitespace-nowrap'>
                {t('dashboard.quickActions.newReport') || 'Ny rapport'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Draft Reports Widget */}
      {(() => {
        const draftReports = state.reports?.filter(r => r.status === 'draft') || [];
        if (draftReports.length === 0) return null;

        const mostRecentDraft = draftReports.sort((a, b) => {
          const dateA = a.lastEdited
            ? new Date(a.lastEdited).getTime()
            : new Date(a.createdAt || 0).getTime();
          const dateB = b.lastEdited
            ? new Date(b.lastEdited).getTime()
            : new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        })[0];

        return (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center'>
                  <FileText className='w-5 h-5 text-slate-600' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-slate-900'>
                    {t('reports.draftReports') || 'Draft Reports'}
                  </h3>
                  <p className='text-sm text-slate-600'>
                    {draftReports.length === 1
                      ? t('reports.oneDraft') || 'You have 1 draft report'
                      : t('reports.draftCount', { count: draftReports.length }) ||
                        `You have ${draftReports.length} draft reports`}
                  </p>
                  {mostRecentDraft && (
                    <p className='text-xs text-slate-500 mt-1'>
                      {t('reports.mostRecentDraft') || 'Most recent'}:{' '}
                      {mostRecentDraft.customerName ||
                        t('reports.unnamedCustomer') ||
                        'Unnamed Customer'}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => (window.location.href = '/admin/reports?statusFilter=draft')}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  {t('reports.viewDrafts') || 'View All Drafts'}
                </button>
                {mostRecentDraft && (
                  <button
                    onClick={() => (window.location.href = `/report/edit/${mostRecentDraft.id}`)}
                    className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                  >
                    {t('reports.resume') || 'Resume Latest'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Role-Specific Content */}
      {currentUser?.role === 'superadmin' && branchStats.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <Building className='w-6 h-6 text-slate-600' />
              {t('dashboard.branchPerformance')}
            </h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              {branchStats.map(branch => (
                <div
                  key={branch.id}
                  className='bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all'
                >
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                    <h3 className='text-lg font-semibold text-slate-900 truncate'>{branch.name}</h3>
                    <span className='px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-sm font-medium self-start sm:self-auto'>
                      {branch.completionRate}%
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-1'>
                        {t('dashboard.reports')}
                      </p>
                      <p className='text-2xl font-bold text-slate-900'>{branch.totalReports}</p>
                    </div>
                    <div>
                      <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-1'>
                        {t('dashboard.revenue')}
                      </p>
                      <p className='text-xl font-bold text-slate-900 truncate'>
                        {branch.totalRevenue.toLocaleString('sv-SE')}{' '}
                        <span className='text-sm'>SEK</span>
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-4 border-t border-slate-200'>
                    <span className='text-slate-600'>
                      {t('dashboard.activeUsers')}:{' '}
                      <span className='font-semibold text-slate-900'>{branch.activeUsers}</span>
                    </span>
                    <span className='text-slate-600'>
                      {t('dashboard.pending')}:{' '}
                      <span className='font-semibold text-slate-900'>{branch.pendingReports}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'branchAdmin' && teamMembers.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <Users className='w-6 h-6 text-slate-600' />
              {t('dashboard.teamActivity')}
            </h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {teamMembers.map(member => (
                <div key={member.id} className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-medium text-slate-700'>
                          {member.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className='font-semibold text-slate-900'>{member.name}</h3>
                        <p className='text-sm text-slate-600'>{member.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-center'>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <p className='text-xs text-slate-500'>{t('dashboard.active')}</p>
                      <p className='text-lg font-bold text-slate-900'>{member.activeReports}</p>
                    </div>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <p className='text-xs text-slate-500'>{t('dashboard.completed')}</p>
                      <p className='text-lg font-bold text-slate-900'>{member.completedThisWeek}</p>
                    </div>
                    <div className='bg-slate-100 p-3 rounded-lg'>
                      <p className='text-xs text-slate-500'>{t('dashboard.status')}</p>
                      <p
                        className={`text-xs font-semibold ${
                          member.status === 'active' ? 'text-slate-700' : 'text-slate-500'
                        }`}
                      >
                        {member.status === 'active'
                          ? t('dashboard.status.active')
                          : t('dashboard.status.inactive')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Agreements Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' && serviceAgreements.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <FileCheck className='w-6 h-6 text-slate-600' />
              {t('dashboard.serviceAgreements.activeAgreements') || 'Service Agreements'}
            </h2>
            <button
              onClick={() => navigate('/admin/service-agreements')}
              className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
            >
              {t('dashboard.viewAll') || 'View All'} →
            </button>
          </div>
          <div className='p-6'>
            {(() => {
              const activeAgreements = serviceAgreements.filter(sa => sa.status === 'active');
              const expiringSoon = serviceAgreements.filter(sa => {
                if (sa.status !== 'active' || !sa.endDate) return false;
                const endDate = new Date(sa.endDate);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                return endDate <= thirtyDaysFromNow && endDate >= new Date();
              });

              const monthlyRevenue = activeAgreements.reduce((sum, sa) => {
                // Calculate monthly revenue from service agreements
                let annualRevenue = 0;
                if (sa.pricingStructure?.perRoof) {
                  annualRevenue = sa.pricingStructure.perRoof;
                } else if (sa.pricingStructure?.perSquareMeter) {
                  // Estimate 100m² if building size not available
                  annualRevenue = sa.pricingStructure.perSquareMeter * 100;
                } else if (sa.price) {
                  annualRevenue = sa.billingFrequency === 'semi-annual' ? sa.price * 2 : sa.price;
                }
                return sum + annualRevenue / 12;
              }, 0);

              return (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.serviceAgreements.activeAgreements')}
                    </p>
                    <p className='text-3xl font-bold text-slate-900'>{activeAgreements.length}</p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.serviceAgreements.ofTotal', {
                        total: serviceAgreements.length,
                      })}
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.serviceAgreements.monthlyRevenue')}
                    </p>
                    <p className='text-3xl font-bold text-slate-900'>
                      {monthlyRevenue.toLocaleString('sv-SE')}
                    </p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.serviceAgreements.sekPerMonthRecurring')}
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.serviceAgreements.expiringSoon')}
                    </p>
                    <p className='text-3xl font-bold text-slate-900'>{expiringSoon.length}</p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.serviceAgreements.next30Days')}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Scheduled Visits Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' && scheduledVisits.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <Calendar className='w-6 h-6 text-slate-600' />
              {t('dashboard.scheduledVisits.title')}
            </h2>
            <button
              onClick={() => navigate('/schedule')}
              className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
            >
              {t('dashboard.scheduledVisits.viewCalendar')} →
            </button>
          </div>
          <div className='p-6'>
            {(() => {
              const now = new Date();
              const nextWeek = new Date(now);
              nextWeek.setDate(nextWeek.getDate() + 7);
              const nextMonth = new Date(now);
              nextMonth.setDate(nextMonth.getDate() + 30);

              const upcoming = scheduledVisits.filter(v => {
                const visitDate = new Date(v.scheduledDate);
                return visitDate >= now && visitDate <= nextWeek && v.status === 'scheduled';
              });

              const completedThisWeek = scheduledVisits.filter(v => {
                if (!v.completedAt) return false;
                const completedDate = new Date(v.completedAt);
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return v.status === 'completed' && completedDate >= weekAgo;
              });

              const overdue = scheduledVisits.filter(v => {
                const visitDate = new Date(v.scheduledDate);
                return visitDate < now && v.status === 'scheduled';
              });

              const completionRate =
                scheduledVisits.length > 0
                  ? Math.round(
                      (completedThisWeek.length /
                        scheduledVisits.filter(v => {
                          const visitDate = new Date(v.scheduledDate);
                          const weekAgo = new Date(now);
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return visitDate >= weekAgo;
                        }).length) *
                        100
                    )
                  : 0;

              return (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.scheduledVisits.upcoming7Days')}
                    </p>
                    <p className='text-3xl font-bold text-slate-900'>{upcoming.length}</p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.scheduledVisits.scheduledVisits')}
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('common.status.completed')}
                    </p>
                    <p className='text-3xl font-bold text-green-600'>{completedThisWeek.length}</p>
                    <p className='text-sm text-slate-600 mt-2'>{t('dashboard.thisWeek')}</p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.scheduledVisits.overdue')}
                    </p>
                    <p className='text-3xl font-bold text-red-600'>{overdue.length}</p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.requiresAttention')}
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.completionRate')}
                    </p>
                    <p className='text-3xl font-bold text-slate-900'>{completionRate}%</p>
                    <p className='text-sm text-slate-600 mt-2'>{t('dashboard.thisWeek')}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Financial Breakdown Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <TrendingUp className='w-6 h-6 text-slate-600' />
              {t('dashboard.financialOverview.title')}
            </h2>
            <button
              onClick={() => navigate('/admin/analytics')}
              className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
            >
              {t('dashboard.financialOverview.viewAnalytics')} →
            </button>
          </div>
          <div className='p-6'>
            {(() => {
              const reports = state.reports || [];
              const branchReports = reports.filter(r => r.branchId === currentUser?.branchId);

              // One-time report revenue
              const oneTimeRevenue = branchReports.reduce(
                (sum, r) => sum + (r.offerValue || r.estimatedCost || 0),
                0
              );

              // Service Agreement revenue (monthly)
              const activeAgreements = serviceAgreements.filter(sa => sa.status === 'active');
              const serviceAgreementMonthlyRevenue = activeAgreements.reduce((sum, sa) => {
                let annualRevenue = 0;
                if (sa.pricingStructure?.perRoof) {
                  annualRevenue = sa.pricingStructure.perRoof;
                } else if (sa.pricingStructure?.perSquareMeter) {
                  annualRevenue = sa.pricingStructure.perSquareMeter * 100; // Estimate
                } else if (sa.price) {
                  annualRevenue = sa.billingFrequency === 'semi-annual' ? sa.price * 2 : sa.price;
                }
                return sum + annualRevenue / 12;
              }, 0);

              // Annual service agreement revenue
              const serviceAgreementAnnualRevenue = activeAgreements.reduce((sum, sa) => {
                let annualRevenue = 0;
                if (sa.pricingStructure?.perRoof) {
                  annualRevenue = sa.pricingStructure.perRoof;
                } else if (sa.pricingStructure?.perSquareMeter) {
                  annualRevenue = sa.pricingStructure.perSquareMeter * 100; // Estimate
                } else if (sa.price) {
                  annualRevenue = sa.billingFrequency === 'semi-annual' ? sa.price * 2 : sa.price;
                }
                return sum + annualRevenue;
              }, 0);

              const totalRevenue = oneTimeRevenue + serviceAgreementAnnualRevenue;
              const recurringPercentage =
                totalRevenue > 0
                  ? Math.round((serviceAgreementAnnualRevenue / totalRevenue) * 100)
                  : 0;

              const currencyCode = getCurrencyCode();

              return (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.financialOverview.oneTimeRevenue')}
                    </p>
                    <p className='text-2xl font-bold text-slate-900'>
                      {oneTimeRevenue.toLocaleString('sv-SE')}
                    </p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {currencyCode} ({t('reports.reports')} & {t('offers.offers')})
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.financialOverview.recurringRevenue')}
                    </p>
                    <p className='text-2xl font-bold text-green-600'>
                      {serviceAgreementAnnualRevenue.toLocaleString('sv-SE')}
                    </p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {currencyCode}/år ({serviceAgreementMonthlyRevenue.toLocaleString('sv-SE')}/
                      {t('time.month')})
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.totalRevenue')}
                    </p>
                    <p className='text-2xl font-bold text-slate-900'>
                      {totalRevenue.toLocaleString('sv-SE')}
                    </p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {currencyCode} ({t('common.allSources')})
                    </p>
                  </div>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                    <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-2'>
                      {t('dashboard.financialOverview.recurringPercent')}
                    </p>
                    <p className='text-2xl font-bold text-purple-600'>{recurringPercentage}%</p>
                    <p className='text-sm text-slate-600 mt-2'>
                      {t('dashboard.financialOverview.ofTotalRevenue')}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pending Customer Responses Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' &&
        appointments.length > 0 &&
        (() => {
          const pendingResponses = appointments.filter(apt => apt.customerResponse === 'pending');
          if (pendingResponses.length === 0) return null;

          return (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
              <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
                  <Bell className='w-6 h-6 text-orange-600' />
                  {t('dashboard.pendingCustomerResponses.title') || 'Pending Customer Responses'}
                  <span className='ml-2 px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium'>
                    {pendingResponses.length}
                  </span>
                </h2>
                <button
                  onClick={() => navigate('/schedule')}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  {t('dashboard.viewAll') || 'View All'} →
                </button>
              </div>
              <div className='p-6'>
                <div className='space-y-3'>
                  {pendingResponses.slice(0, 5).map(apt => (
                    <div
                      key={apt.id}
                      className='bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors cursor-pointer'
                      onClick={() => navigate(`/schedule?appointment=${apt.id}`)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-slate-900 mb-1'>{apt.customerName}</h3>
                          <p className='text-sm text-slate-600 mb-2'>{apt.customerAddress}</p>
                          <div className='flex items-center gap-4 text-xs text-slate-500'>
                            <span className='flex items-center gap-1'>
                              <Calendar className='w-3 h-3' />
                              {apt.scheduledDate} {apt.scheduledTime}
                            </span>
                            {apt.assignedInspectorName && (
                              <span className='flex items-center gap-1'>
                                <User className='w-3 h-3' />
                                {apt.assignedInspectorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className='px-2.5 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium'>
                          {t('schedule.status.awaitingResponse') || 'Awaiting Response'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingResponses.length > 5 && (
                  <p className='text-sm text-slate-500 mt-4 text-center'>
                    {t('dashboard.andMore', { count: pendingResponses.length - 5 }) ||
                      `+${pendingResponses.length - 5} more`}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

      {/* Rejected Orders Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' && rejectedOrders.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <XCircle className='w-6 h-6 text-red-600' />
              {t('dashboard.rejectedOrders.title') || 'Rejected Orders'}
              <span className='ml-2 px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-sm font-medium'>
                {rejectedOrders.length}
              </span>
            </h2>
            <button
              onClick={() => navigate('/admin/customers?tab=rejected')}
              className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
            >
              {t('dashboard.viewAll') || 'View All'} →
            </button>
          </div>
          <div className='p-6'>
            <div className='space-y-3'>
              {rejectedOrders.slice(0, 5).map(order => (
                <div key={order.id} className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-slate-900 mb-1'>{order.customerName}</h3>
                      <p className='text-sm text-slate-600 mb-2'>
                        {t('dashboard.rejectedOrders.rejectedOn') || 'Rejected on'}:{' '}
                        {new Date(order.rejectedAt).toLocaleDateString()}
                      </p>
                      {order.rejectedReason && (
                        <p className='text-xs text-slate-500 italic'>"{order.rejectedReason}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {rejectedOrders.length > 5 && (
              <p className='text-sm text-slate-500 mt-4 text-center'>
                {t('dashboard.andMore', { count: rejectedOrders.length - 5 }) ||
                  `+${rejectedOrders.length - 5} more`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Inspections Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' &&
        scheduledVisits.length > 0 &&
        (() => {
          const now = new Date();
          const nextWeek = new Date(now);
          nextWeek.setDate(nextWeek.getDate() + 7);

          const upcoming = scheduledVisits
            .filter(v => {
              const visitDate = new Date(v.scheduledDate);
              return visitDate >= now && visitDate <= nextWeek && v.status === 'scheduled';
            })
            .sort(
              (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
            )
            .slice(0, 5);

          if (upcoming.length === 0) return null;

          return (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
              <div className='p-6 border-b border-slate-200 flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
                  <Calendar className='w-6 h-6 text-blue-600' />
                  {t('dashboard.upcomingInspections.title') || 'Upcoming Inspections'}
                  <span className='ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
                    {upcoming.length}
                  </span>
                </h2>
                <button
                  onClick={() => navigate('/schedule')}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  {t('dashboard.viewCalendar') || 'View Calendar'} →
                </button>
              </div>
              <div className='p-6'>
                <div className='space-y-3'>
                  {upcoming.map(visit => (
                    <div
                      key={visit.id}
                      className='bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer'
                      onClick={() => navigate(`/schedule?visit=${visit.id}`)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-slate-900 mb-1'>
                            {visit.customerName || visit.buildingAddress}
                          </h3>
                          <p className='text-sm text-slate-600 mb-2'>
                            {visit.buildingAddress || visit.customerAddress}
                          </p>
                          <div className='flex items-center gap-4 text-xs text-slate-500'>
                            <span className='flex items-center gap-1'>
                              <Calendar className='w-3 h-3' />
                              {visit.scheduledDate} {visit.scheduledTime || ''}
                            </span>
                            {visit.assignedInspectorName && (
                              <span className='flex items-center gap-1'>
                                <User className='w-3 h-3' />
                                {visit.assignedInspectorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className='px-2.5 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium'>
                          {t(`schedule.status.${visit.status}`) || visit.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Quick Actions Widget for Branch Admin */}
      {currentUser?.role === 'branchAdmin' && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <Zap className='w-6 h-6 text-yellow-600' />
              {t('dashboard.quickActions.title') || 'Quick Actions'}
            </h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <button
                onClick={() => navigate('/schedule?action=create')}
                className='bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-left transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <Calendar className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {t('dashboard.quickActions.createAppointment') || 'Create Appointment'}
                    </p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {t('dashboard.quickActions.scheduleInspection') || 'Schedule inspection'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/customers?action=create')}
                className='bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-left transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                    <User className='w-5 h-5 text-green-600' />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {t('dashboard.quickActions.addCustomer') || 'Add Customer'}
                    </p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {t('dashboard.quickActions.newCustomer') || 'New customer'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/report/new')}
                className='bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-left transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <FileText className='w-5 h-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {t('dashboard.quickActions.newReport') || 'New Report'}
                    </p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {t('dashboard.quickActions.createReport') || 'Create report'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/service-agreements?action=create')}
                className='bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-left transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                    <FileCheck className='w-5 h-5 text-orange-600' />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {t('dashboard.quickActions.serviceAgreement') || 'Service Agreement'}
                    </p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {t('dashboard.quickActions.createAgreement') || 'Create agreement'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'inspector' && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
          <div className='p-6 border-b border-slate-200'>
            <h2 className='text-2xl font-semibold text-slate-900 flex items-center gap-2'>
              <Calendar className='w-6 h-6 text-slate-600' />
              {t('dashboard.todayTasks')} ({todayTasks.length})
            </h2>
          </div>
          <div className='p-6'>
            {todayTasks.length === 0 ? (
              <div className='text-center py-8'>
                <Calendar className='w-12 h-12 text-slate-400 mx-auto mb-4' />
                <p className='text-slate-600'>{t('dashboard.noTasksToday')}</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {todayTasks.map(task => (
                  <div
                    key={task.id}
                    className='bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all'
                    onClick={() => {
                      // Navigate to report edit if it's a draft, or create new from task
                      if (task.status === 'inProgress' || task.status === 'draft') {
                        navigate(`/report/edit/${task.id}`);
                      } else {
                        // Create new report for scheduled task
                        navigate('/report/new', {
                          state: {
                            customerName: task.customer,
                            customerAddress: task.address,
                            scheduledDate: task.scheduledDate,
                          },
                        });
                      }
                    }}
                  >
                    <h3 className='font-semibold text-slate-900 mb-2'>{task.title}</h3>
                    <div className='grid grid-cols-2 gap-2 text-sm text-slate-600'>
                      <div className='flex items-center'>
                        <User className='w-4 h-4 mr-2 text-slate-500' />
                        {task.customer}
                      </div>
                      <div className='flex items-center'>
                        <MapPin className='w-4 h-4 mr-2 text-slate-500' />
                        {task.address}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDashboard;
