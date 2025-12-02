/**
 * Smart Dashboard Component - COMPLETE IMPLEMENTATION
 * 
 * Unified dashboard that adapts based on user role.
 * Replaces SuperadminDashboard, BranchAdminDashboard, and InspectorDashboard.
 * 
 * All data loading logic copied from original dashboards for full functionality.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import { useIntl } from '../../hooks/useIntl';
import { formatCurrencyAmount, getCurrencyPreference, Currency } from '../../utils/currencyUtils';
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
  const { t, locale } = useIntl();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCurrency] = useState<Currency>(getCurrencyPreference());
  const [inspectorStats, setInspectorStats] = useState({
    scheduledThisWeek: 0,
    averageTime: 0,
    totalReports: 0
  });

  useEffect(() => {
    if (currentUser) {
      // Redirect customers to customer dashboard
      if (currentUser.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
        return;
      }
      loadDashboardData();
    }
  }, [currentUser, navigate]);

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
      console.error('Error loading dashboard data:', error);
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
      branches.map(async (branch) => {
        const branchReports = reports.filter(report => report.branchId === branch.id);
        const branchUsers = users.filter(user => user.branchId === branch.id);
        
        const totalReports = branchReports.length;
        const completedReports = branchReports.filter(r => r.status === 'completed').length;
        const pendingReports = branchReports.filter(r => r.status === 'draft').length;
        const totalRevenue = branchReports.reduce((sum, report) => sum + (report.offerValue || 0), 0);
        const activeUsers = branchUsers.length;
        const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
        
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
    await fetchReports();
    
    const reports = state.reports || [];
    const branchReports = reports.filter(report => report.branchId === currentUser?.branchId);
    const users = await getUsers(currentUser?.branchId);

    const teamMembersData: TeamMember[] = users.map(user => {
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
        role: user.role === 'inspector' ? t('dashboard.roles.inspector') : user.role === 'branchAdmin' ? t('dashboard.roles.branchAdmin') : t('dashboard.roles.user'),
        activeReports: userReports.filter(r => r.status === 'draft').length,
        completedThisWeek,
        lastActivity: user.lastLogin ? 
          new Date(user.lastLogin).toLocaleString('sv-SE') : 
          'Aldrig',
        status: user.isActive ? 'active' : 'inactive' as const,
      };
    });

    setTeamMembers(teamMembersData);
  };

  const loadInspectorData = async () => {
    await fetchReports();
    const reports = state.reports || [];
    
    // Filter by inspector's UID, not inspectorId
    const inspectorReports = reports.filter(
      report => report.createdBy === currentUser?.uid
    );

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
    const avgTime = completedReports.length > 0 
      ? (totalTime / completedReports.length).toFixed(1) 
      : '0';

    // Store in state for KPI calculation
    setInspectorStats({
      scheduledThisWeek,
      averageTime: parseFloat(avgTime),
      totalReports: inspectorReports.length
    });

    // Map to tasks
    const tasksData: Task[] = inspectorReports.map(report => ({
      id: report.id,
      title: `Takinspektion - ${report.customerName}`,
      customer: report.customerName || 'Okänd kund',
      address: report.customerAddress || 'Ingen adress',
      scheduledDate: report.inspectionDate ? 
        new Date(report.inspectionDate).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      priority: report.status === 'draft' ? 'medium' : 'low',
      status: report.status === 'completed' ? 'completed' : 
              report.status === 'draft' ? 'inProgress' : 'scheduled',
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
      const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
      const activeUsers = branchStats.reduce((sum, b) => sum + b.activeUsers, 0);

      return [
        { label: t('dashboard.totalReports'), value: totalReports, subtitle: t('dashboard.totalReportsDesc'), icon: FileText, iconColor: 'text-blue-600' },
        { label: t('dashboard.totalRevenue'), value: formatCurrencyAmount(totalRevenue, selectedCurrency, locale), subtitle: t('dashboard.offerValueDesc'), icon: DollarSign, iconColor: 'text-green-600' },
        { label: t('dashboard.completionRate'), value: `${completionRate}%`, subtitle: t('dashboard.completedReportsDesc'), icon: BarChart3, iconColor: 'text-purple-600' },
        { label: t('dashboard.activeUsers'), value: activeUsers, subtitle: t('dashboard.acrossAllBranches'), icon: Users, iconColor: 'text-orange-600' },
      ];
    }

    if (currentUser?.role === 'branchAdmin') {
      const branchReports = reports.filter(r => r.branchId === currentUser?.branchId);
      const totalReports = branchReports.length;
      const completedReports = branchReports.filter(r => r.status === 'completed').length;
      const pendingReports = branchReports.filter(r => r.status === 'draft').length;
      const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
      const teamProductivity = teamMembers.reduce((sum, m) => sum + m.completedThisWeek, 0);

      return [
        { label: t('dashboard.totalReports'), value: totalReports, subtitle: '+15% ' + t('dashboard.vsLastWeek'), icon: FileText, iconColor: 'text-blue-600' },
        { label: t('dashboard.completionRate'), value: `${completionRate}%`, subtitle: t('dashboard.aboveTarget'), icon: CheckCircle, iconColor: 'text-green-600' },
        { label: t('dashboard.pendingReports'), value: pendingReports, subtitle: t('dashboard.requiresAttention'), icon: AlertTriangle, iconColor: 'text-orange-600' },
        { label: t('dashboard.teamProductivity'), value: teamProductivity, subtitle: t('dashboard.thisWeek'), icon: Activity, iconColor: 'text-purple-600' },
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
          iconColor: 'text-green-600' 
        },
        { 
          label: t('dashboard.scheduledThisWeek'), 
          value: inspectorStats.scheduledThisWeek,  // Use real data
          subtitle: t('dashboard.upcoming'), 
          icon: Calendar, 
          iconColor: 'text-blue-600' 
        },
        { 
          label: t('dashboard.averageTime'), 
          value: inspectorStats.averageTime,  // Use real data
          subtitle: t('dashboard.hours'), 
          icon: Clock, 
          iconColor: 'text-purple-600' 
        },
        { 
          label: t('dashboard.totalReports'), 
          value: inspectorStats.totalReports,  // Use real data
          subtitle: t('dashboard.allTime'), 
          icon: FileText, 
          iconColor: 'text-yellow-600' 
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
      {/* Welcome Message */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h2 className='text-2xl font-semibold text-slate-900'>
          {t('dashboard.welcomeBack', { name: currentUser?.displayName || currentUser?.email || 'User' })} 👋
        </h2>
        <p className='text-slate-600 mt-1'>
          {currentUser?.role === 'inspector' && `You have ${todayTasks.length} appointments today.`}
          {currentUser?.role === 'branchAdmin' && `You have ${state.reports?.filter(r => r.status === 'draft').length || 0} draft reports and ${teamMembers.length} team members.`}
          {currentUser?.role === 'superadmin' && `You have ${branchStats.length} branches under management.`}
        </p>
      </div>

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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                <kpi.icon className={`w-5 h-5 text-slate-600`} />
              </div>
              <div className='flex-1 text-right'>
                <p className='text-xs font-medium text-slate-500 uppercase tracking-wide mb-2'>
                  {kpi.label}
                </p>
                <p className='text-3xl font-bold text-slate-900 mb-1'>{kpi.value}</p>
                <p className='text-xs text-slate-500 font-light truncate'>
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Draft Reports Widget */}
      {(() => {
        const draftReports = state.reports?.filter(r => r.status === 'draft') || [];
        if (draftReports.length === 0) return null;
        
        const mostRecentDraft = draftReports.sort((a, b) => {
          const dateA = a.lastEdited ? new Date(a.lastEdited).getTime() : new Date(a.createdAt || 0).getTime();
          const dateB = b.lastEdited ? new Date(b.lastEdited).getTime() : new Date(b.createdAt || 0).getTime();
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
                      {t('reports.mostRecentDraft') || 'Most recent'}: {mostRecentDraft.customerName || t('reports.unnamedCustomer') || 'Unnamed Customer'}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => window.location.href = '/admin/reports?statusFilter=draft'}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  {t('reports.viewDrafts') || 'View All Drafts'}
                </button>
                {mostRecentDraft && (
                  <button
                    onClick={() => window.location.href = `/report/edit/${mostRecentDraft.id}`}
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
              {branchStats.map((branch) => (
                <div key={branch.id} className='bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                    <h3 className='text-lg font-semibold text-slate-900 truncate'>{branch.name}</h3>
                    <span className='px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-sm font-medium self-start sm:self-auto'>
                      {branch.completionRate}%
                    </span>
                  </div>
                  
                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-1'>{t('dashboard.reports')}</p>
                      <p className='text-2xl font-bold text-slate-900'>{branch.totalReports}</p>
                    </div>
                    <div>
                      <p className='text-xs text-slate-500 uppercase tracking-wide font-medium mb-1'>{t('dashboard.revenue')}</p>
                      <p className='text-xl font-bold text-slate-900 truncate'>
                        {formatCurrencyAmount(branch.totalRevenue, selectedCurrency, locale)}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-4 border-t border-slate-200'>
                    <span className='text-slate-600'>{t('dashboard.activeUsers')}: <span className='font-semibold text-slate-900'>{branch.activeUsers}</span></span>
                    <span className='text-slate-600'>{t('dashboard.pending')}: <span className='font-semibold text-slate-900'>{branch.pendingReports}</span></span>
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
              {teamMembers.map((member) => (
                <div key={member.id} className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-medium text-slate-700'>
                          {member.name.split(' ').map(n => n[0]).join('')}
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
                      <p className={`text-xs font-semibold ${
                        member.status === 'active' 
                          ? 'text-slate-700' 
                          : 'text-slate-500'
                      }`}>
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
                {todayTasks.map((task) => (
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
                          }
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
