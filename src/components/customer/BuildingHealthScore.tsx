import React, { useMemo } from 'react';
import { Building, Report } from '../../types';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';

interface BuildingHealthScoreProps {
  building: Building;
  reports: Report[];
  className?: string;
}

interface HealthMetrics {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  factors: {
    lastInspectionAge: number; // Days since last inspection
    criticalIssues: number;
    totalIssues: number;
    maintenanceFrequency: number; // Average days between inspections
    hasActiveAgreement: boolean;
  };
  recommendations: string[];
}

const BuildingHealthScore: React.FC<BuildingHealthScoreProps> = ({ building, reports, className = '' }) => {
  const { t, locale } = useIntl();

  const healthMetrics = useMemo((): HealthMetrics => {
    const buildingReports = reports.filter(r => r.buildingId === building.id || r.customerAddress === building.address);
    const sortedReports = [...buildingReports].sort((a, b) => {
      const dateA = new Date(a.inspectionDate || a.createdAt).getTime();
      const dateB = new Date(b.inspectionDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    const latestReport = sortedReports[0];
    const lastInspectionDate = latestReport
      ? new Date(latestReport.inspectionDate || latestReport.createdAt)
      : null;

    // Calculate days since last inspection
    const lastInspectionAge = lastInspectionDate
      ? Math.floor((Date.now() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999; // Very old if no inspections

    // Count issues
    const criticalIssues = latestReport
      ? latestReport.issuesFound?.filter(
          issue => issue.severity === 'critical' || issue.severity === 'high'
        ).length || 0
      : 0;
    const totalIssues = latestReport?.issuesFound?.length || 0;

    // Calculate maintenance frequency (average days between inspections)
    let maintenanceFrequency = 365; // Default to 1 year
    if (sortedReports.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < sortedReports.length - 1; i++) {
        const date1 = new Date(sortedReports[i].inspectionDate || sortedReports[i].createdAt).getTime();
        const date2 = new Date(sortedReports[i + 1].inspectionDate || sortedReports[i + 1].createdAt).getTime();
        intervals.push(Math.floor((date1 - date2) / (1000 * 60 * 60 * 24)));
      }
      if (intervals.length > 0) {
        maintenanceFrequency = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      }
    }

    // Calculate score (0-100)
    let score = 100;

    // Deduct points for inspection age
    if (lastInspectionAge > 730) score -= 30; // > 2 years: -30
    else if (lastInspectionAge > 365) score -= 20; // > 1 year: -20
    else if (lastInspectionAge > 180) score -= 10; // > 6 months: -10

    // Deduct points for critical issues
    score -= criticalIssues * 15; // Each critical issue: -15

    // Deduct points for total issues
    score -= Math.min(totalIssues * 2, 20); // Each issue: -2, max -20

    // Deduct points for poor maintenance frequency
    if (maintenanceFrequency > 730) score -= 10; // > 2 years between: -10
    else if (maintenanceFrequency > 365) score -= 5; // > 1 year: -5

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine status
    let status: HealthMetrics['status'];
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else if (score >= 20) status = 'poor';
    else status = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (lastInspectionAge > 365) {
      recommendations.push(t('customerDashboard.health.recommendations.scheduleInspection') || 'Schedule a new inspection');
    }
    if (criticalIssues > 0) {
      recommendations.push(t('customerDashboard.health.recommendations.addressCriticalIssues') || 'Address critical issues immediately');
    }
    if (totalIssues > 5) {
      recommendations.push(t('customerDashboard.health.recommendations.reviewAllIssues') || 'Review and address all identified issues');
    }
    if (maintenanceFrequency > 365) {
      recommendations.push(t('customerDashboard.health.recommendations.increaseFrequency') || 'Consider more frequent inspections');
    }
    if (recommendations.length === 0) {
      recommendations.push(t('customerDashboard.health.recommendations.maintainSchedule') || 'Continue regular maintenance schedule');
    }

    return {
      score: Math.round(score),
      status,
      factors: {
        lastInspectionAge,
        criticalIssues,
        totalIssues,
        maintenanceFrequency: Math.round(maintenanceFrequency),
        hasActiveAgreement: false, // TODO: Check service agreements
      },
      recommendations,
    };
  }, [building, reports, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100 border-green-500';
      case 'good':
        return 'text-blue-600 bg-blue-100 border-blue-500';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100 border-yellow-500';
      case 'poor':
        return 'text-orange-600 bg-orange-100 border-orange-500';
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-500';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className='w-5 h-5' />;
      case 'fair':
        return <Activity className='w-5 h-5' />;
      case 'poor':
      case 'critical':
        return <AlertTriangle className='w-5 h-5' />;
      default:
        return <Activity className='w-5 h-5' />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
          <Activity className='w-5 h-5 mr-2 text-gray-600' />
          {t('customerDashboard.health.title') || 'Building Health Score'}
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(healthMetrics.status)} flex items-center gap-1`}>
          {getStatusIcon(healthMetrics.status)}
          <span className='capitalize'>{healthMetrics.status}</span>
        </div>
      </div>

      {/* Score Display */}
      <div className='mb-6'>
        <div className='flex items-end gap-2 mb-2'>
          <span className={`text-5xl font-bold ${getScoreColor(healthMetrics.score)}`}>
            {healthMetrics.score}
          </span>
          <span className='text-2xl text-gray-500 mb-1'>/100</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-3'>
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              healthMetrics.score >= 80
                ? 'bg-green-500'
                : healthMetrics.score >= 60
                ? 'bg-blue-500'
                : healthMetrics.score >= 40
                ? 'bg-yellow-500'
                : healthMetrics.score >= 20
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${healthMetrics.score}%` }}
          ></div>
        </div>
      </div>

      {/* Factors */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <Clock className='w-5 h-5 text-gray-600 mx-auto mb-1' />
          <p className='text-xs text-gray-600 mb-1'>{t('customerDashboard.health.lastInspection') || 'Last Inspection'}</p>
          <p className='text-sm font-semibold text-gray-900'>
            {healthMetrics.factors.lastInspectionAge < 999
              ? `${healthMetrics.factors.lastInspectionAge} ${t('customerDashboard.health.daysAgo') || 'days'}`
              : t('customerDashboard.health.never') || 'Never'}
          </p>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <AlertTriangle className='w-5 h-5 text-red-600 mx-auto mb-1' />
          <p className='text-xs text-gray-600 mb-1'>{t('customerDashboard.health.criticalIssues') || 'Critical Issues'}</p>
          <p className='text-sm font-semibold text-red-600'>{healthMetrics.factors.criticalIssues}</p>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <Activity className='w-5 h-5 text-gray-600 mx-auto mb-1' />
          <p className='text-xs text-gray-600 mb-1'>{t('customerDashboard.health.totalIssues') || 'Total Issues'}</p>
          <p className='text-sm font-semibold text-gray-900'>{healthMetrics.factors.totalIssues}</p>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <TrendingUp className='w-5 h-5 text-gray-600 mx-auto mb-1' />
          <p className='text-xs text-gray-600 mb-1'>{t('customerDashboard.health.avgFrequency') || 'Avg Frequency'}</p>
          <p className='text-sm font-semibold text-gray-900'>
            {Math.round(healthMetrics.factors.maintenanceFrequency / 30)} {t('customerDashboard.health.months') || 'months'}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {healthMetrics.recommendations.length > 0 && (
        <div className='border-t border-gray-200 pt-4'>
          <h4 className='text-sm font-semibold text-gray-900 mb-2'>
            {t('customerDashboard.health.recommendations.title') || 'Recommendations'}
          </h4>
          <ul className='space-y-2'>
            {healthMetrics.recommendations.map((rec, index) => (
              <li key={index} className='flex items-start gap-2 text-sm text-gray-700'>
                <CheckCircle className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BuildingHealthScore;

