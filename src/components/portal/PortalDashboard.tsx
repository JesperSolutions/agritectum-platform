import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { getServiceAgreementsByCustomer } from '../../services/serviceAgreementService';
import { getScheduledVisitsByCustomer } from '../../services/scheduledVisitService';
import { getReportsByCustomerId } from '../../services/reportService';
import { Building, ServiceAgreement, ScheduledVisit, Report } from '../../types';
import {
  Building as BuildingIcon,
  FileCheck,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import LoadingSpinner from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';
import BuildingsMapOverview from './BuildingsMapOverview';

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
  const [buildings, setBuildings] = useState<BuildingWithStatus[]>([]);
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Load buildings - use companyId (linked customer/company document) not user uid
      const customerId = currentUser.companyId || currentUser.uid;
      const buildingsData = await getBuildingsByCustomer(customerId);

      // Load reports to calculate building status
      const reportsData = await getReportsByCustomerId(customerId);
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

      // Load service agreements
      const agreementsData = await getServiceAgreementsByCustomer(customerId);
      setAgreements(agreementsData);

      // Load scheduled visits
      const visitsData = await getScheduledVisitsByCustomer(customerId);
      setVisits(visitsData);
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const activeAgreements = agreements.filter(a => a.status === 'active');
  const upcomingVisits = visits
    .filter(v => v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date())
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);
  const pendingAcceptances = visits
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

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {currentUser?.displayName
            ? t('dashboard.welcomeBack', { name: currentUser.displayName })
            : t('dashboard.subtitle')}
        </h1>
        <p className='mt-2 text-gray-600'>{t('dashboard.subtitle')}</p>
      </div>

      {/* Health Score Legend */}
      <div className='bg-slate-50 border border-slate-200 rounded-lg p-5'>
        <div className='flex items-start gap-3'>
          <div className='bg-slate-600 rounded-lg p-2 flex-shrink-0'>
            <Info className='w-4 h-4 text-white' />
          </div>
          <div className='flex-1'>
            <h3 className='text-sm font-semibold text-slate-900 mb-3'>
              Understanding Your Building Health Scores
            </h3>
            <p className='text-sm text-slate-700 leading-relaxed mb-3'>
              Each building receives a health grade from <strong>A (Excellent)</strong> to{' '}
              <strong>F (Critical)</strong> based on a 100-point scale. Buildings scoring 90+ earn
              an A, 80-89 get a B, 70-79 receive a C, 60-69 get a D, and anything below 60 is rated
              F.
            </p>
            <p className='text-xs text-slate-600 leading-relaxed'>
              <strong>How scores are calculated:</strong> We evaluate three key factors—when the
              building was last inspected (40% of score), the number of critical issues found (30%
              of score), and how regularly maintenance is performed (30% of score).
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium text-gray-600'>{t('navigation.buildings')}</p>
              <div className='group relative'>
                <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-48 z-10'>
                  Total number of properties in your portfolio
                </div>
              </div>
            </div>
            <BuildingIcon className='w-8 h-8 text-slate-600' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>{buildings.length}</p>
          <div className='mt-3 flex items-center gap-2 text-xs font-medium'>
            <span className='px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300'>
              {gradeCounts.A}A
            </span>
            <span className='px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300'>
              {gradeCounts.B}B
            </span>
            <span className='px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300'>
              {gradeCounts.C}C
            </span>
            <span className='px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300'>
              {gradeCounts.D}D
            </span>
            <span className='px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300'>
              {gradeCounts.F}F
            </span>
          </div>
          <Link
            to='/portal/buildings'
            className='mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-700'
          >
            {t('dashboard.viewAll')} <ArrowRight className='ml-1 w-4 h-4' />
          </Link>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium text-gray-600'>Portfolio Health</p>
              <div className='group relative'>
                <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-56 z-10'>
                  Average health score across all buildings. Higher is better (0-100 scale)
                </div>
              </div>
            </div>
            <div className='w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50'>
              <span className='text-xl font-bold text-slate-700'>
                {avgHealthScore >= 90
                  ? 'A'
                  : avgHealthScore >= 80
                    ? 'B'
                    : avgHealthScore >= 70
                      ? 'C'
                      : avgHealthScore >= 60
                        ? 'D'
                        : 'F'}
              </span>
            </div>
          </div>
          <p className='text-3xl font-bold text-gray-900'>{avgHealthScore}</p>
          <p className='text-xs text-gray-500 mt-1'>Average Score</p>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium text-gray-600'>Total Costs</p>
              <div className='group relative'>
                <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-56 z-10'>
                  Total maintenance and inspection costs across all buildings (labor + materials +
                  travel)
                </div>
              </div>
            </div>
            <FileCheck className='w-8 h-8 text-slate-600' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {totalCosts > 0 ? `${Math.round(totalCosts / 1000)}k` : '—'}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            {avgCostPerBuilding > 0
              ? `${Math.round(avgCostPerBuilding / 1000)}k avg/building`
              : 'SEK'}
          </p>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium text-gray-600'>Upcoming Inspections</p>
              <div className='group relative'>
                <HelpCircle className='w-4 h-4 text-gray-400 cursor-help' />
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-48 z-10'>
                  Number of scheduled roof inspections
                </div>
              </div>
            </div>
            <Calendar className='w-8 h-8 text-slate-600' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>{upcomingVisits.length}</p>
          <Link
            to='/portal/scheduled-visits'
            className='mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-700'
          >
            {t('dashboard.viewAll')} <ArrowRight className='ml-1 w-4 h-4' />
          </Link>
        </div>
      </div>

      {/* Buildings Needing Attention */}
      {buildingsNeedingAttention.length > 0 && (
        <div className='bg-white rounded-lg shadow'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-slate-600' />
              <h2 className='text-xl font-semibold text-gray-900'>Buildings Needing Attention</h2>
            </div>
            <p className='text-sm text-gray-600 mt-1'>
              Properties that need inspection or maintenance soon
            </p>
          </div>
          <div className='p-6'>
            <div className='space-y-3'>
              {buildingsNeedingAttention.map(building => (
                <Link
                  key={building.id}
                  to={`/portal/buildings/${building.id}`}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3'>
                      <div className='flex flex-col items-center'>
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${getGradeColor(building.healthGrade)}`}
                        >
                          <span className='text-xl font-bold'>{building.healthGrade}</span>
                        </div>
                        <span className='text-xs text-gray-500 mt-1'>{building.healthScore}</span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{building.address}</p>
                        <p className='text-sm text-gray-600 mt-1'>
                          {building.lastInspectionDate
                            ? `Last inspected: ${new Date(building.lastInspectionDate).toLocaleDateString()} (${building.daysSinceInspection} days ago)`
                            : 'Never inspected'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(building.status)}`}
                  >
                    {getStatusText(building.status)}
                  </span>
                </Link>
              ))}
            </div>
            {buildings.filter(b => b.status === 'urgent' || b.status === 'check-soon').length >
              5 && (
              <Link
                to='/portal/buildings'
                className='mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-700'
              >
                View All Buildings <ArrowRight className='ml-1 w-4 h-4' />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Pending Acceptances */}
      {pendingAcceptances.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg shadow'>
          <div className='p-6 border-b border-yellow-200'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {t('schedule.visits.respondToAppointment')}
            </h2>
            <p className='text-sm text-gray-600 mt-1'>{t('schedule.visits.respondSubtitle')}</p>
          </div>
          <div className='p-6'>
            <div className='space-y-4'>
              {pendingAcceptances.map(visit => (
                <div
                  key={visit.id}
                  className='flex items-center justify-between p-4 border border-yellow-300 rounded-lg bg-white hover:bg-yellow-50'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{visit.title}</p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>{visit.customerAddress}</p>
                  </div>
                  <Link
                    to={`/portal/appointment/${visit.id}/respond?token=${visit.publicToken || ''}`}
                    className='px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors'
                  >
                    {t('schedule.visits.respondToAppointment')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Visits */}
      {upcomingVisits.length > 0 && (
        <div className='bg-white rounded-lg shadow'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {t('dashboard.scheduledVisits.title')}
            </h2>
          </div>
          <div className='p-6'>
            <div className='space-y-4'>
              {upcomingVisits.map(visit => (
                <div
                  key={visit.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{visit.title}</p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                    </p>
                    {visit.buildingId && (
                      <p className='text-sm text-gray-500 mt-1'>{visit.customerAddress}</p>
                    )}
                  </div>
                  <span className='px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full'>
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Buildings Map Overview */}
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {t('dashboard.map.title') || 'Your Buildings'}
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            {t('dashboard.map.subtitle') || 'Overview of all your property locations'}
          </p>
        </div>
        <div className='p-6'>
          <BuildingsMapOverview buildings={buildings} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          {t('dashboard.quickActions.title')}
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Link
            to='/portal/buildings'
            className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <BuildingIcon className='w-6 h-6 text-green-600 mb-2' />
            <p className='font-medium text-gray-900'>{t('navigation.buildings')}</p>
            <p className='text-sm text-gray-600 mt-1'>{t('dashboard.branchInfo.address')}</p>
          </Link>
          <Link
            to='/portal/profile'
            className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <FileCheck className='w-6 h-6 text-blue-600 mb-2' />
            <p className='font-medium text-gray-900'>{t('navigation.profile')}</p>
            <p className='text-sm text-gray-600 mt-1'>{t('dashboard.personalWorkspace')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
