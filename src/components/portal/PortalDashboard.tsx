import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { getScheduledVisitsByCustomer } from '../../services/scheduledVisitService';
import { getReportsByCustomerId } from '../../services/reportService';
import {
  getDashboardPreferences,
  saveDashboardPreferences,
  resetToDefaults,
  DashboardWidget,
} from '../../services/dashboardCustomizationService';
import { Building, ServiceAgreement, ScheduledVisit, Report } from '../../types';
import {
  Building as BuildingIcon,
  FileCheck,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Info,
  HelpCircle,
  Sliders,
  Wallet,
} from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import LoadingSpinner from '../common/LoadingSpinner';
import { PortalDashboardSkeleton } from '../common/SkeletonLoader';
import { logger } from '../../utils/logger';
import BuildingsMapOverview from './BuildingsMapOverview';
import PortfolioHealthReport from './PortfolioHealthReport';
import DashboardCustomizer from './DashboardCustomizer';
import ComponentErrorBoundary from '../common/ComponentErrorBoundary';
import { useToast } from '../../contexts/ToastContext';
import { ProgressRing, GradeDistribution, StatusIndicator } from '../common/DashboardVisuals';
import { getCurrencyCode } from '../../utils/currency';

type BuildingStatus = 'good' | 'check-soon' | 'urgent';
type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

interface BuildingWithStatus extends Building {
  status: BuildingStatus;
  lastInspectionDate?: string;
  daysSinceInspection?: number;
  healthGrade: HealthGrade;
  healthScore: number;
}

const PortalDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const [buildings, setBuildings] = useState<BuildingWithStatus[]>([]);
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Load preferences first, then load data selectively
      loadDashboardPreferences();
    }
  }, [currentUser]);

  const loadDashboardPreferences = async () => {
    if (!currentUser) return;
    try {
      const prefs = await getDashboardPreferences(currentUser.uid);
      setWidgets(prefs.widgets);
      // Load dashboard data AFTER preferences are loaded
      loadDashboardData(prefs.widgets);
    } catch (error) {
      logger.error('Error loading dashboard preferences:', error);
      // Silently fail - use defaults, load all data
      loadDashboardData([]);
    }
  };

  const loadDashboardData = async (widgetConfig: DashboardWidget[] = widgets) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Load buildings - always needed for most widgets
      const customerId = currentUser.companyId || currentUser.uid;
      const buildingsData = await getBuildingsByCustomer(customerId);

      // Determine which datasets to load based on enabled widgets
      const enabledWidgets = widgetConfig.length > 0 ? widgetConfig : widgets;
      const hasReportWidgets = enabledWidgets.some(w =>
        w.enabled && ['portfolioHealthSummary', 'portfolioHealthReport', 'buildingsNeedingAttention'].includes(w.name)
      );
      const hasAgreementWidgets = enabledWidgets.some(w =>
        w.enabled && ['serviceAgreements', 'serviceAgreementMonitor'].includes(w.name)
      );
      const hasVisitWidgets = enabledWidgets.some(w =>
        w.enabled && ['upcomingVisits', 'pendingAppointments'].includes(w.name)
      );

      // Load reports only if needed
      let reportsData: Report[] = [];
      if (hasReportWidgets || buildingsData.length > 0) {
        reportsData = await getReportsByCustomerId(customerId);
      }
      setReports(reportsData);

      // Calculate status for each building
      const buildingsWithStatus: BuildingWithStatus[] = buildingsData.map(building => {
        const buildingReports = reportsData
          .filter(r => r.buildingId === building.id)
          .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));

        const lastReport = buildingReports[0];
        let status: BuildingStatus = 'urgent';
        let daysSinceInspection: number | undefined;
        let healthScore = 0;

        if (lastReport) {
          const lastInspectionDate = new Date(lastReport.inspectionDate);
          const today = new Date();
          daysSinceInspection = Math.floor(
            (today.getTime() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Calculate health score (0-100)
          // 1. Inspection freshness (0-40 points)
          let freshnessScore = 40;
          if (daysSinceInspection > 365) {
            freshnessScore = 0;
          } else if (daysSinceInspection > 180) {
            freshnessScore = 20;
          } else if (daysSinceInspection > 90) {
            freshnessScore = 30;
          }

          // 2. Critical issues (0-30 points) - fewer issues = more points
          const criticalIssues =
            lastReport.issuesFound?.filter(i => i.severity === 'critical' || i.severity === 'high')
              .length || 0;
          let issuesScore = 30;
          if (criticalIssues > 5) {
            issuesScore = 0;
          } else if (criticalIssues > 3) {
            issuesScore = 10;
          } else if (criticalIssues > 1) {
            issuesScore = 20;
          }

          // 3. Maintenance frequency (0-30 points) - more inspections = better
          const inspectionCount = buildingReports.length;
          let maintenanceScore = 30;
          if (inspectionCount === 1) {
            maintenanceScore = 10;
          } else if (inspectionCount === 2) {
            maintenanceScore = 20;
          }

          healthScore = freshnessScore + issuesScore + maintenanceScore;

          // Status logic: 0-180 days = good, 181-365 = check soon, 365+ = urgent
          if (daysSinceInspection <= 180) {
            status = 'good';
          } else if (daysSinceInspection <= 365) {
            status = 'check-soon';
          } else {
            status = 'urgent';
          }

          // Convert health score to grade
          let healthGrade: HealthGrade = 'F';
          if (healthScore >= 90) healthGrade = 'A';
          else if (healthScore >= 80) healthGrade = 'B';
          else if (healthScore >= 70) healthGrade = 'C';
          else if (healthScore >= 60) healthGrade = 'D';

          return {
            ...building,
            status,
            lastInspectionDate: lastReport.inspectionDate,
            daysSinceInspection,
            healthGrade,
            healthScore,
          };
        }

        // No inspection yet = F grade, urgent status
        return {
          ...building,
          status: 'urgent',
          daysSinceInspection: undefined,
          healthGrade: 'F' as HealthGrade,
          healthScore: 0,
        };
      });

      setBuildings(buildingsWithStatus);

      // Load service agreements only if needed
      if (hasAgreementWidgets) {
        const agreementsData = await getServiceAgreementsByCustomer(customerId);
        setAgreements(agreementsData);
      }

      // Load scheduled visits only if needed
      if (hasVisitWidgets) {
        const visitsData = await getScheduledVisitsByCustomer(customerId);
        setVisits(visitsData);
      }
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='p-6'>
        <PortalDashboardSkeleton />
      </div>
    );
  }

  // Calculate derived data
  const activeAgreementsList = agreements.filter(a => a.status === 'active');
  const upcomingVisitsList = visits
    .filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date())
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);
  const pendingAcceptancesList = visits
    .filter(v => v.customerResponse === 'pending' && v.status === 'scheduled')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Portfolio statistics
  const statusCounts = {
    good: buildings.filter(b => b.status === 'good').length,
    checkSoon: buildings.filter(b => b.status === 'check-soon').length,
    urgent: buildings.filter(b => b.status === 'urgent').length,
  };

  // Health grade distribution
  const gradeCounts = {
    A: buildings.filter(b => b.healthGrade === 'A').length,
    B: buildings.filter(b => b.healthGrade === 'B').length,
    C: buildings.filter(b => b.healthGrade === 'C').length,
    D: buildings.filter(b => b.healthGrade === 'D').length,
    F: buildings.filter(b => b.healthGrade === 'F').length,
  };

  // Average health score
  const avgHealthScore =
    buildings.length > 0
      ? Math.round(buildings.reduce((sum, b) => sum + b.healthScore, 0) / buildings.length)
      : 0;

  // Cost analytics
  const totalCosts = reports.reduce((sum, r) => {
    return (
      sum + (r.laborCost || 0) + (r.materialCost || 0) + (r.travelCost || 0) + (r.overheadCost || 0)
    );
  }, 0);

  const avgCostPerBuilding = buildings.length > 0 ? totalCosts / buildings.length : 0;

  // Buildings needing attention (urgent or check soon)
  const buildingsNeedingAttention = buildings
    .filter(b => b.status === 'urgent' || b.status === 'check-soon')
    .sort((a, b) => {
      // Sort urgent first, then by days since inspection
      if (a.status === 'urgent' && b.status !== 'urgent') return -1;
      if (a.status !== 'urgent' && b.status === 'urgent') return 1;
      return (b.daysSinceInspection || 999999) - (a.daysSinceInspection || 999999);
    })
    .slice(0, 5);

  const statistics = {
    activeAgreements: activeAgreementsList,
    upcomingVisits: upcomingVisitsList,
    pendingAcceptances: pendingAcceptancesList,
    statusCounts,
    gradeCounts,
    avgHealthScore,
    totalCosts,
    avgCostPerBuilding,
    buildingsNeedingAttention,
  };

  const getStatusIcon = (status: BuildingStatus) => {
    switch (status) {
      case 'good':
        return '✓';
      case 'check-soon':
        return '○';
      case 'urgent':
        return '!';
    }
  };

  const getStatusText = (status: BuildingStatus) => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'check-soon':
        return 'Review Soon';
      case 'urgent':
        return 'Needs Inspection';
    }
  };

  const getStatusColor = (status: BuildingStatus) => {
    switch (status) {
      case 'good':
        return 'text-slate-700 bg-slate-50 border-slate-300';
      case 'check-soon':
        return 'text-slate-600 bg-slate-100 border-slate-400';
      case 'urgent':
        return 'text-slate-800 bg-slate-200 border-slate-500';
    }
  };

  const getGradeColor = (grade: HealthGrade) => {
    switch (grade) {
      case 'A':
        return 'text-green-700 bg-green-50 border-green-300';
      case 'B':
        return 'text-blue-700 bg-blue-50 border-blue-300';
      case 'C':
        return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      case 'D':
        return 'text-orange-700 bg-orange-50 border-orange-300';
      case 'F':
        return 'text-red-700 bg-red-50 border-red-300';
    }
  };

  const handleSaveWidgetPreferences = async (updatedWidgets: DashboardWidget[]) => {
    if (!currentUser) return;
    try {
      // Update local state immediately for responsive UI
      setWidgets(updatedWidgets);
      // Persist to Firestore
      await saveDashboardPreferences(currentUser.uid, updatedWidgets);
      showSuccess('Dashboard customization saved');
    } catch (error) {
      logger.error('Error saving dashboard preferences:', error);
      showError('Failed to save dashboard preferences');
    }
  };

  const handleResetWidgets = async () => {
    if (!currentUser) return;
    try {
      await resetToDefaults(currentUser.uid);
      await loadDashboardPreferences();
      showSuccess('Dashboard reset to defaults');
    } catch (error) {
      logger.error('Error resetting dashboard:', error);
      showError('Failed to reset dashboard');
    }
  };

  const isWidgetEnabled = (widgetName: string): boolean => {
    const widget = widgets.find(w => w.name === widgetName);
    return widget ? widget.enabled : true; // Default to enabled if not found
  };

  // Get sorted widgets for rendering in customized order
  const getSortedEnabledWidgets = () => {
    const sorted = [...widgets]
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
    
    // Log widget order for debugging
    if (sorted.length > 0 && process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard widget order:', sorted.map((w, i) => `${i + 1}. ${w.label} (order=${w.order})`));
    }
    
    return sorted.map(w => w.name);
  };

  const renderWidgetContent = (widgetName: string): React.ReactNode => {
    switch (widgetName) {
      case 'healthScoreLegend':
        return (
          <div className='bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-6 animate-fade-in'>
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700 flex-shrink-0 shadow-sm'>
                <Info className='w-6 h-6 text-white' />
              </div>
              <div className='flex-1'>
                <h3 className='text-base font-semibold text-slate-900 mb-2'>
                  {t('portal.healthScores.title')}
                </h3>
                <p className='text-sm text-slate-600 leading-relaxed mb-4'>
                  {t('portal.healthScores.explanation')}
                </p>
                
                {/* Grade legend */}
                <div className='flex flex-wrap gap-2 mb-4'>
                  {[
                    { grade: 'A', color: 'bg-green-100 text-green-700 border-green-200', range: '90-100' },
                    { grade: 'B', color: 'bg-blue-100 text-blue-700 border-blue-200', range: '80-89' },
                    { grade: 'C', color: 'bg-amber-100 text-amber-700 border-amber-200', range: '70-79' },
                    { grade: 'D', color: 'bg-orange-100 text-orange-700 border-orange-200', range: '60-69' },
                    { grade: 'F', color: 'bg-red-100 text-red-700 border-red-200', range: '0-59' },
                  ].map(({ grade, color, range }) => (
                    <div key={grade} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>
                      <span className='text-base'>{grade}</span>
                      <span className='text-[10px] opacity-75'>({range})</span>
                    </div>
                  ))}
                </div>
                
                <p className='text-xs text-slate-500 leading-relaxed'>
                  <strong className='text-slate-700'>{t('portal.healthScores.howCalculated')}:</strong> {t('portal.healthScores.howCalculatedDesc')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'statsCards':
        return (
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6'>
            {/* Buildings Card */}
            <div 
              className='relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-fade-in'
              style={{ animationDelay: '0ms' }}
            >
              <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 to-slate-600' />
              <div className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium text-slate-600'>{t('portal.stats.buildings')}</p>
                      <div className='group relative'>
                        <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-48 z-10'>
                          {t('portal.stats.buildingsDesc')}
                        </div>
                      </div>
                    </div>
                    <p className='text-3xl font-bold text-gray-900 mt-2 tabular-nums'>{buildings.length}</p>
                  </div>
                  <div className='w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-500 to-slate-600 group-hover:scale-110 transition-transform duration-300'>
                    <BuildingIcon className='w-6 h-6 text-white' />
                  </div>
                </div>
                
                {/* Grade Distribution Bar */}
                <div className='mt-4'>
                  <GradeDistribution 
                    grades={statistics.gradeCounts} 
                    height='sm'
                    showLabels={true}
                    showCounts={true}
                  />
                </div>
                
                <Link
                  to='/portal/buildings'
                  className='mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 group/link'
                >
                  {t('dashboard.viewAll')} 
                  <ArrowRight className='ml-1 w-4 h-4 transition-transform group-hover/link:translate-x-0.5' />
                </Link>
              </div>
            </div>

            {/* Portfolio Health Card with Progress Ring */}
            <div 
              className='relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-fade-in'
              style={{ animationDelay: '100ms' }}
            >
              <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600' />
              <div className='p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <p className='text-sm font-medium text-slate-600'>{t('portal.stats.portfolioHealth')}</p>
                  <div className='group relative'>
                    <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-56 z-10'>
                      {t('portal.stats.portfolioHealthDesc')}
                    </div>
                  </div>
                </div>
                
                <div className='flex justify-center'>
                  <ProgressRing
                    value={statistics.avgHealthScore}
                    max={100}
                    size='md'
                    grade={
                      statistics.avgHealthScore >= 90 ? 'A' :
                      statistics.avgHealthScore >= 80 ? 'B' :
                      statistics.avgHealthScore >= 70 ? 'C' :
                      statistics.avgHealthScore >= 60 ? 'D' : 'F'
                    }
                    sublabel={t('portal.stats.averageScore')}
                  />
                </div>
              </div>
            </div>

            {/* Total Costs Card */}
            <div 
              className='relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-fade-in'
              style={{ animationDelay: '200ms' }}
            >
              <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600' />
              <div className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium text-slate-600'>{t('portal.stats.totalCosts')}</p>
                      <div className='group relative'>
                        <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-56 z-10'>
                          {t('portal.stats.totalCostsDesc')}
                        </div>
                      </div>
                    </div>
                    <p className='text-3xl font-bold text-gray-900 mt-2 tabular-nums'>
                      {statistics.totalCosts > 0 ? `${Math.round(statistics.totalCosts / 1000)}k` : '—'}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {statistics.avgCostPerBuilding > 0
                        ? `${Math.round(statistics.avgCostPerBuilding / 1000)}k ${t('portal.stats.avgPerBuilding')}`
                        : getCurrencyCode()}
                    </p>
                  </div>
                  <div className='w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600'>
                    <Wallet className='w-6 h-6 text-white' />
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Inspections Card */}
            <div 
              className='relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-fade-in'
              style={{ animationDelay: '300ms' }}
            >
              <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600' />
              <div className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium text-slate-600'>{t('portal.stats.upcomingInspections')}</p>
                      <div className='group relative'>
                        <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-48 z-10'>
                          {t('portal.stats.upcomingInspectionsDesc')}
                        </div>
                      </div>
                    </div>
                    <p className='text-3xl font-bold text-gray-900 mt-2 tabular-nums'>{statistics.upcomingVisits.length}</p>
                    
                    {/* Status indicators */}
                    <div className='flex items-center gap-3 mt-3'>
                      <StatusIndicator 
                        status={statistics.statusCounts.urgent > 0 ? 'urgent' : 'neutral'} 
                        label={`${statistics.statusCounts.urgent} urgent`}
                        pulse={statistics.statusCounts.urgent > 0}
                        size='sm'
                      />
                    </div>
                  </div>
                  <div className='w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600'>
                    <Calendar className='w-6 h-6 text-white' />
                  </div>
                </div>
                
                <Link
                  to='/portal/scheduled-visits'
                  className='mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 group/link'
                >
                  {t('dashboard.viewAll')} 
                  <ArrowRight className='ml-1 w-4 h-4 transition-transform group-hover/link:translate-x-0.5' />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'buildingsNeedingAttention':
        if (statistics.buildingsNeedingAttention.length === 0) return null;
        return (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in'>
            <div className='p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100'>
                  <AlertTriangle className='w-5 h-5 text-amber-600' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>Buildings Needing Attention</h2>
                  <p className='text-sm text-gray-500'>
                    Properties that need inspection or maintenance soon
                  </p>
                </div>
              </div>
            </div>
            <div className='p-6'>
              <div className='space-y-3'>
                {statistics.buildingsNeedingAttention.map((building, index) => (
                  <Link
                    key={building.id}
                    to={`/portal/buildings/${building.id}`}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group animate-fade-in'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-3'>
                        <div className='flex flex-col items-center'>
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getGradeColor(building.healthGrade)} transition-transform group-hover:scale-105`}
                          >
                            <span className='text-xl font-bold'>{building.healthGrade}</span>
                          </div>
                          <span className='text-xs text-gray-500 mt-1 font-medium'>{building.healthScore}/100</span>
                        </div>
                        <div>
                          <p className='font-medium text-gray-900 group-hover:text-slate-700 transition-colors'>{building.address}</p>
                          <p className='text-sm text-gray-600 mt-1'>
                            {building.lastInspectionDate
                              ? `Last inspected: ${new Date(building.lastInspectionDate).toLocaleDateString()} (${building.daysSinceInspection} days ago)`
                              : 'Never inspected'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <StatusIndicator 
                        status={building.status === 'urgent' ? 'urgent' : 'warning'}
                        pulse={building.status === 'urgent'}
                        size='md'
                      />
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(building.status)}`}
                      >
                        {getStatusText(building.status)}
                      </span>
                      <ArrowRight className='w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all' />
                    </div>
                  </Link>
                ))}
              </div>
              {buildings.filter(b => b.status === 'urgent' || b.status === 'check-soon').length > 5 && (
                <div className='mt-4 pt-4 border-t border-gray-200 flex items-center justify-between'>
                  <p className='text-xs text-gray-500'>
                    Showing 5 of {buildings.filter(b => b.status === 'urgent' || b.status === 'check-soon').length} buildings
                  </p>
                  <Link
                    to='/portal/buildings'
                    className='inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 group/link'
                  >
                    View All <ArrowRight className='ml-1 w-4 h-4 transition-transform group-hover/link:translate-x-0.5' />
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

      case 'portfolioHealthReport':
        if (buildings.length === 0) return null;
        return (
          <ComponentErrorBoundary componentName='Portfolio Health Report'>
            <PortfolioHealthReport 
              buildings={buildings} 
              reports={reports}
              onExportPDF={() => {
                alert('PDF export feature coming soon!');
              }}
            />
          </ComponentErrorBoundary>
        );

      case 'pendingAppointments':
        if (statistics.pendingAcceptances.length === 0) return null;
        return (
          <div className='bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden animate-fade-in'>
            <div className='p-6 border-b border-amber-200 bg-gradient-to-r from-amber-100/50 to-transparent'>
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500'>
                    <Calendar className='w-5 h-5 text-white' />
                  </div>
                  <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse'>
                    {statistics.pendingAcceptances.length}
                  </span>
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {t('schedule.visits.respondToAppointment')}
                  </h2>
                  <p className='text-sm text-amber-700'>{t('schedule.visits.respondSubtitle')}</p>
                </div>
              </div>
            </div>
            <div className='p-6'>
              <div className='space-y-3'>
                {pendingAcceptances.map((visit, index) => (
                  <div
                    key={visit.id}
                    className='flex items-center justify-between p-4 border border-amber-200 rounded-xl bg-white hover:bg-amber-50 transition-all duration-200 group animate-fade-in'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-amber-100 border border-amber-200'>
                        <span className='text-xs font-medium text-amber-600'>
                          {new Date(visit.scheduledDate).toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className='text-lg font-bold text-amber-800'>
                          {new Date(visit.scheduledDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{visit.title}</p>
                        <p className='text-sm text-gray-600 mt-0.5'>
                          {visit.scheduledTime}
                        </p>
                        <p className='text-sm text-gray-500 mt-0.5'>{visit.customerAddress}</p>
                      </div>
                    </div>
                    <Link
                      to={`/portal/appointment/${visit.id}/respond?token=${visit.publicToken || ''}`}
                      className='px-4 py-2 text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm hover:shadow group-hover:scale-105'
                    >
                      {t('schedule.visits.respondToAppointment')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'upcomingVisits':
        if (statistics.upcomingVisits.length === 0) return null;
        return (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in'>
            <div className='p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-green-100'>
                  <Calendar className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {t('dashboard.scheduledVisits.title')}
                  </h2>
                  <p className='text-sm text-gray-500'>Your next scheduled inspections</p>
                </div>
              </div>
            </div>
            <div className='p-6'>
              <div className='space-y-3'>
                {statistics.upcomingVisits.map((visit, index) => (
                  <div
                    key={visit.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group animate-fade-in'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 border border-slate-200'>
                        <span className='text-xs font-medium text-slate-500'>
                          {new Date(visit.scheduledDate).toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className='text-lg font-bold text-slate-900'>
                          {new Date(visit.scheduledDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{visit.title}</p>
                        <p className='text-sm text-gray-600 mt-0.5'>
                          {visit.scheduledTime}
                        </p>
                        {visit.buildingId && (
                          <p className='text-sm text-gray-500 mt-0.5'>{visit.customerAddress}</p>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <StatusIndicator status='good' size='sm' />
                      <span className='px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full border border-green-200'>
                        {visit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {visits.filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date()).length > 5 && (
                <div className='mt-4 pt-4 border-t border-gray-200 flex items-center justify-between'>
                  <p className='text-xs text-gray-500'>
                    Showing 5 of {visits.filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date()).length} visits
                  </p>
                  <Link
                    to='/portal/scheduled-visits'
                    className='inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 group/link'
                  >
                    View All <ArrowRight className='ml-1 w-4 h-4 transition-transform group-hover/link:translate-x-0.5' />
                  </Link>
                </div>
              )}
            </div>
          </div>
        );

      case 'buildingsMap':
        return (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in'>
            <div className='p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100'>
                  <BuildingIcon className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {t('dashboard.map.title') || 'Your Buildings'}
                  </h2>
                  <p className='text-sm text-gray-500'>
                    {t('dashboard.map.subtitle') || 'Overview of all your property locations'}
                  </p>
                </div>
              </div>
            </div>
            <div className='p-4'>
              <ComponentErrorBoundary componentName='Buildings Map'>
                <div className='rounded-xl overflow-hidden border border-slate-200'>
                  <BuildingsMapOverview buildings={buildings} />
                </div>
              </ComponentErrorBoundary>
            </div>
          </div>
        );

      case 'quickActions':
        return (
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in'>
            <div className='flex items-center gap-3 mb-5'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100'>
                <ArrowRight className='w-5 h-5 text-slate-600' />
              </div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {t('dashboard.quickActions.title')}
              </h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Link
                to='/portal/buildings'
                className='p-5 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 group'
              >
                <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 mb-3 group-hover:scale-105 transition-transform'>
                  <BuildingIcon className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-gray-900'>{t('navigation.buildings')}</p>
                <p className='text-sm text-gray-500 mt-1'>{t('dashboard.branchInfo.address')}</p>
              </Link>
              <Link
                to='/portal/profile'
                className='p-5 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 group'
              >
                <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-500 to-slate-600 mb-3 group-hover:scale-105 transition-transform'>
                  <FileCheck className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-gray-900'>{t('navigation.profile')}</p>
                <p className='text-sm text-gray-500 mt-1'>{t('dashboard.personalWorkspace')}</p>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='space-y-8'>
      {/* Header with Customize Button */}
      <div className='flex items-start justify-between'>
        <button
          onClick={() => setShowCustomizer(true)}
          className='flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap'
          title='Customize dashboard sections'
        >
          <Sliders className='w-4 h-4' />
          Customize
        </button>
      </div>

      {/* Render widgets in customized order */}
      {getSortedEnabledWidgets().map((widgetName) => (
        <div key={widgetName}>
          {renderWidgetContent(widgetName)}
        </div>
      ))}

      {/* Dashboard Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer
          widgets={widgets}
          onSave={handleSaveWidgetPreferences}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
};

export default PortalDashboard;
